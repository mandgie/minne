// minne.sh is canonical. www.minne.sh is bound to this worker only so it can be
// sent here — path and query intact, permanently.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.minne.sh") {
      url.hostname = "minne.sh";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
