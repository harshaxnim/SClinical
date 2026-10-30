/*
 * Static replacements for the two WordPress features that needed the server:
 * - contact forms: "Send Message" opens the visitor's e-mail app with the message filled in;
 * - search: the box searches search-index.json (the text of every page) and lists matches
 *   in place of the page content.
 */
(function () {
  var TO = 'info@s-clinical.com';
  var ROOT = document.currentScript.src.replace(/static-site\.js(\?.*)?$/, '');

  function field(form, key) {
    var el = form.querySelector('[name$="[' + key + ']"]');
    return el ? el.value.trim() : '';
  }

  function esc(t) {
    return t.replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; });
  }

  function snippet(text, term) {
    var i = text.toLowerCase().indexOf(term);
    var start = Math.max(0, i - 80);
    return (start ? '… ' : '') + text.slice(start, start + 220) + (start + 220 < text.length ? ' …' : '');
  }

  function search(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var main = document.querySelector('main');
    if (!terms.length || !main) return;
    fetch(ROOT + 'search-index.json').then(function (r) { return r.json(); }).then(function (pages) {
      var hits = pages.filter(function (p) {
        var hay = (p.title + ' ' + p.text).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      var items = hits.map(function (p) {
        return '<li style="margin-bottom:1.5em"><h3 style="margin-bottom:.3em"><a href="' + ROOT + p.url + '">' +
          esc(p.title) + '</a></h3><p style="margin:0">' + esc(snippet(p.text, terms[0])) + '</p></li>';
      }).join('');
      main.innerHTML = '<div class="container" style="padding:60px 15px">' +
        '<h1>Search results for “' + esc(query) + '”</h1>' +
        (hits.length ? '<ul style="list-style:none;padding:0;margin-top:2em">' + items + '</ul>'
                     : '<p>No page contains these words. Please try other words, or write to <a href="mailto:' +
                       TO + '">' + TO + '</a>.</p>') + '</div>';
      document.title = 'Search results for “' + query + '” – S-Clinical';
      window.scrollTo(0, 0);
    });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.classList && form.classList.contains('search-form')) {
      e.preventDefault();
      var input = form.querySelector('[name="s"]');
      search(input ? input.value : '');
      document.body.classList.remove('is-menu-sidebar');
      return;
    }
    if (!form.classList || !form.classList.contains('content-form')) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var name = field(form, 'name'), email = field(form, 'email');
    var subject = field(form, 'phone') || 'Enquiry from the S-Clinical website';
    var message = field(form, 'message');
    var body = message + '\n\n' + [name, email].filter(Boolean).join('\n');
    var link = document.createElement('a');
    link.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body.trim());
    link.className = 'static-contact-mailto';
    link.hidden = true;
    form.appendChild(link);
    link.click();
    link.remove();

    var note = form.querySelector('.static-contact-note');
    if (!note) {
      note = document.createElement('p');
      note.className = 'static-contact-note';
      note.style.marginTop = '1em';
      form.appendChild(note);
    }
    note.innerHTML = 'Your e-mail app should now open with this message. If it does not, please write to ' +
      '<a href="mailto:' + TO + '">' + TO + '</a>.';
  }, true);
})();
