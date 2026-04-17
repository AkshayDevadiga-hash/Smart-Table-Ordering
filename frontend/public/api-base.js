(function () {
  function base() {
    if (typeof window === "undefined" || window.__API_BASE__ == null) return "";
    return String(window.__API_BASE__).replace(/\/$/, "");
  }
  window.apiUrl = function apiUrl(path) {
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return base() + "/api" + p;
  };
  window.assetUrl = function assetUrl(path) {
    if (path == null || path === "") return path;
    if (/^https?:\/\//i.test(path)) return path;
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return base() + p;
  };
})();
