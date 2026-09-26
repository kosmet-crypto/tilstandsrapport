package app.boligforvalter;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Hosts the Oslo Boligforvalter web app (bundled in assets/www) in a full-screen WebView.
 * Pages are served from https://appassets.androidplatform.net so IndexedDB
 * behaves like on a normal https site.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/www/index.html";
    private static final String APK_NAME = "boligforvalter.apk";
    private static final int REQ_PICK_FILE = 1;
    private static final int REQ_SAVE_FILE = 2;

    private WebView webView;
    private ValueCallback<Uri[]> pendingPick;
    private Uri pendingCameraUri;
    private byte[] pendingSaveBytes;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Ota.prepare(this);

        // Downloaded web content (see Ota) wins over the copy inside the APK.
        final WebViewAssetLoader.AssetsPathHandler bundled = new WebViewAssetLoader.AssetsPathHandler(this);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", path -> {
                    WebResourceResponse r = Ota.serve(this, path);
                    return r != null ? r : bundled.handle(path);
                })
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(0xFF002664);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);

        webView.addJavascriptInterface(new Bridge(), "BoligAndroid");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost())) return false;
                // Anything outside the app opens in the browser.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (ActivityNotFoundException ignored) {
                }
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (pendingPick != null) pendingPick.onReceiveValue(null);
                pendingPick = callback;
                pendingCameraUri = null;

                boolean images = false;
                for (String t : params.getAcceptTypes()) if (t != null && t.startsWith("image")) images = true;

                Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                // Backups: MIME types for .json vary by file manager, so allow any file and let the page validate it.
                pick.setType(images ? "image/*" : "*/*");
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }

                Intent chooser = Intent.createChooser(pick, images ? "Legg til bilde" : "Velg fil");
                if (images) {
                    Intent camera = cameraIntent();
                    if (camera != null) chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
                }
                try {
                    startActivityForResult(chooser, REQ_PICK_FILE);
                } catch (ActivityNotFoundException e) {
                    pendingPick = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(START_URL);

        if (savedInstanceState == null) checkForUpdate(false);
    }

    /** A "take photo" intent that writes into our cache, or null if there is no camera app. */
    private Intent cameraIntent() {
        try {
            File dir = new File(getCacheDir(), "camera");
            dir.mkdirs();
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) f.delete();
            File photo = new File(dir, "foto_" + System.currentTimeMillis() + ".jpg");
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".files", photo);
            Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            if (i.resolveActivity(getPackageManager()) == null) return null;
            i.putExtra(MediaStore.EXTRA_OUTPUT, uri);
            i.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            pendingCameraUri = uri;
            return i;
        } catch (Exception e) {
            return null;
        }
    }

    /* ---------- update check ---------- */

    private static final long UPDATE_CHECK_INTERVAL = 60 * 60 * 1000L;

    /**
     * Looks up the latest GitHub Release (tagged v1.0.<versionCode>) and offers to download it
     * when it is newer than this install. The automatic check on launch is throttled and silent;
     * a manual check always runs and reports the result.
     */
    private void checkForUpdate(final boolean manual) {
        final SharedPreferences prefs = getSharedPreferences("update", MODE_PRIVATE);
        long now = System.currentTimeMillis();
        if (!manual && now - prefs.getLong("lastCheck", 0) < UPDATE_CHECK_INTERVAL) return;
        prefs.edit().putLong("lastCheck", now).apply();
        if (manual) toast("Ser etter oppdatering …");

        new Thread(() -> {
            // Web content first: new content is downloaded quietly and used from the next launch;
            // a manual check switches to it right away.
            try {
                if (Ota.check(this) && manual) runOnUiThread(() -> {
                    if (Ota.apply(this)) webView.reload();
                });
            } catch (Exception ignored) {
                // Offline: the content stays as it is.
            }
            try {
                URL api = new URL("https://api.github.com/repos/" + BuildConfig.UPDATE_REPO + "/releases/latest");
                HttpURLConnection c = (HttpURLConnection) api.openConnection();
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                c.setRequestProperty("Accept", "application/vnd.github+json");
                if (c.getResponseCode() != 200) throw new IllegalStateException("HTTP " + c.getResponseCode());
                String body;
                try (InputStream in = c.getInputStream()) {
                    ByteArrayOutputStream buf = new ByteArrayOutputStream();
                    byte[] b = new byte[8192];
                    for (int n; (n = in.read(b)) > 0; ) buf.write(b, 0, n);
                    body = buf.toString("UTF-8");
                }
                String tag = new JSONObject(body).optString("tag_name", "");
                final long latest = Long.parseLong(tag.substring(tag.lastIndexOf('.') + 1));
                final String name = tag.startsWith("v") ? tag.substring(1) : tag;
                // A newer release with the same Android part only has web changes, which Ota brings in.
                if (latest > installedVersionCode() && !Ota.sameNative(body)) runOnUiThread(() -> showUpdateDialog(name));
                else if (manual) toast("Du har nyeste versjon");
            } catch (Exception e) {
                // No network, rate limit or unexpected response: the automatic check tries again later.
                if (manual) toast("Kunne ikke sjekke. Er du på nett?");
            }
        }).start();
    }

    private void toast(final String msg) {
        runOnUiThread(() -> Toast.makeText(this, msg, Toast.LENGTH_SHORT).show());
    }

    @Override
    protected void onResume() {
        super.onResume();
        SelfUpdate.resume(this);
        checkForUpdate(false);
    }

    private long installedVersionCode() throws Exception {
        PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    private void showUpdateDialog(String version) {
        if (isFinishing()) return;
        new AlertDialog.Builder(this)
                .setTitle("Ny versjon")
                .setMessage("Oslo Boligforvalter " + version + " er klar. Installere nå? Dokumentene dine beholdes.")
                .setPositiveButton("Oppdater", (d, w) -> SelfUpdate.start(this))
                .setNegativeButton("Senere", null)
                .show();
    }

    /* ---------- saving and sharing files ---------- */

    /** Asks the user where to save; WebView cannot download blob: URLs. */
    private void saveBytes(String name, String mime, byte[] bytes) {
        pendingSaveBytes = bytes;
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        try {
            startActivityForResult(i, REQ_SAVE_FILE);
        } catch (ActivityNotFoundException e) {
            pendingSaveBytes = null;
            Toast.makeText(this, "Fant ingen app for å lagre filer", Toast.LENGTH_LONG).show();
        }
    }

    /** Opens the share sheet (e-post, Teams, OneDrive …) with the file attached. */
    private void shareBytes(String name, String mime, byte[] bytes, String subject, String text) {
        try {
            File dir = new File(getCacheDir(), "shared");
            dir.mkdirs();
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) f.delete();
            File file = new File(dir, name);
            try (OutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".files", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, subject != null && !subject.isEmpty() ? subject
                    : name.replace('_', ' ').replaceAll("\\.pdf$", ""));
            if (text != null && !text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
            send.setClipData(ClipData.newRawUri(name, uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(send, "Del dokument"));
        } catch (Exception e) {
            Toast.makeText(this, "Kunne ikke dele filen", Toast.LENGTH_LONG).show();
        }
    }

    /** Methods index.html can call as window.BoligAndroid.*. */
    private class Bridge {
        @JavascriptInterface
        public String getVersion() {
            return BuildConfig.VERSION_NAME + Ota.label(MainActivity.this);
        }

        @JavascriptInterface
        public void checkForUpdate() {
            runOnUiThread(() -> MainActivity.this.checkForUpdate(true));
        }

        @JavascriptInterface
        public void saveFile(final String name, final String mime, final String base64) {
            final byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            runOnUiThread(() -> saveBytes(name, mime, bytes));
        }

        @JavascriptInterface
        public void saveText(final String name, final String mime, final String text) {
            final byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
            runOnUiThread(() -> saveBytes(name, mime, bytes));
        }

        @JavascriptInterface
        public void shareFile(final String name, final String mime, final String base64) {
            final byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            runOnUiThread(() -> shareBytes(name, mime, bytes, null, null));
        }

        /** Like shareFile, with a ready e-mail subject and text (the page checks that this exists). */
        @JavascriptInterface
        public void shareFileText(final String name, final String mime, final String base64,
                                  final String subject, final String text) {
            final byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            runOnUiThread(() -> shareBytes(name, mime, bytes, subject, text));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == REQ_PICK_FILE && pendingPick != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK) {
                List<Uri> uris = new ArrayList<>();
                if (data != null && data.getClipData() != null) {
                    ClipData clip = data.getClipData();
                    for (int i = 0; i < clip.getItemCount(); i++) uris.add(clip.getItemAt(i).getUri());
                } else if (data != null && data.getData() != null) {
                    uris.add(data.getData());
                } else if (pendingCameraUri != null) {
                    // The camera returns no data; the photo is in the file we handed it.
                    uris.add(pendingCameraUri);
                }
                if (!uris.isEmpty()) result = uris.toArray(new Uri[0]);
            }
            pendingPick.onReceiveValue(result);
            pendingPick = null;
            pendingCameraUri = null;
        } else if (requestCode == REQ_SAVE_FILE) {
            byte[] bytes = pendingSaveBytes;
            pendingSaveBytes = null;
            Uri uri = (resultCode == RESULT_OK && data != null) ? data.getData() : null;
            if (uri == null || bytes == null) return;
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                out.write(bytes);
                Toast.makeText(this, "Lagret", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Kunne ikke lagre filen", Toast.LENGTH_LONG).show();
            }
        }
    }

    /** Back goes up one screen inside the page (editor → list) before leaving the app. */
    @Override
    public void onBackPressed() {
        webView.evaluateJavascript("window.appBack ? appBack() : false", value -> {
            if (!"true".equals(value)) super.onBackPressed();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }
}
