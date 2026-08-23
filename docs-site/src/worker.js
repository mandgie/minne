// docs.minne.sh — static assets with clean URLs.
//
// The generated dist/ has /guides/minne-key/index.html; the URL people share is
// /guides/minne-key. Cloudflare's asset server will happily serve the directory
// index, but only if the request keeps its trailing-slash-free shape, so the
// one job here is to normalise the path and hand over a real 404 page.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // www.docs.minne.sh, docs.minne.sh/ with a trailing slash on a subpath —
    // one canonical shape, permanently.
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 301);
    }

    const res = await env.ASSETS.fetch(request);
    if (res.status !== 404) return res;

    const notFound = await env.ASSETS.fetch(new URL("/404.html", url).toString());
    return new Response(notFound.body, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
