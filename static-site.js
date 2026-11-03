/*
 * Static replacements for the two WordPress features that needed the server:
 * - contact forms: "Send Message" sends the message to info@s-clinical.com through Web3Forms,
 *   or opens the visitor's e-mail app with it filled in if that fails;
 * - search: the box searches search-index.json (the text of every page) and lists matches
 *   in place of the page content.
 */
(function () {
  var TO = 'info@s-clinical.com';
  // Web3Forms access key for info@s-clinical.com (https://web3forms.com). It only allows
  // sending to that address, so it is safe in public code. Empty: forms open the e-mail app.
  var WEB3FORMS_KEY = 'ad8b481b-535b-44a2-a63f-340c9b07bae2';
  var ROOT = document.currentScript.src.replace(/static-site\.js(\?.*)?$/, '');

  function field(form, key) {
    var el = form.querySelector('[name$="[' + key + ']"]');
    return el ? el.value.trim() : '';
  }

  function note(form, html) {
    var p = form.querySelector('.static-contact-note');
    if (!p) {
      p = document.createElement('p');
      p.className = 'static-contact-note';
      p.style.marginTop = '1em';
      form.appendChild(p);
    }
    p.innerHTML = html;
  }

  // Fallback when the form service is not set up or does not answer.
  function openMailApp(form, msg) {
    var body = msg.message + '\n\n' + [msg.name, msg.email].filter(Boolean).join('\n');
    var link = document.createElement('a');
    link.href = 'mailto:' + TO + '?subject=' + encodeURIComponent(msg.subject) +
      '&body=' + encodeURIComponent(body.trim());
    link.hidden = true;
    form.appendChild(link);
    link.click();
    link.remove();
    note(form, 'The message could not be sent from this page, so your e-mail app should now open with it. ' +
      'If it does not, please write to <a href="mailto:' + TO + '">' + TO + '</a>.');
  }

  // Spam trap: a hidden checkbox that people never see, so only bots tick it.
  document.querySelectorAll('form.content-form').forEach(function (form) {
    var trap = document.createElement('input');
    trap.type = 'checkbox';
    trap.name = 'botcheck';
    trap.tabIndex = -1;
    trap.setAttribute('aria-hidden', 'true');
    trap.style.display = 'none';
    form.appendChild(trap);
  });

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
    if (form.classList.contains('is-sending')) return;

    var msg = {
      name: field(form, 'name'),
      email: field(form, 'email'),
      subject: field(form, 'phone') || 'Enquiry from the S-Clinical website',
      message: field(form, 'message')
    };
    if (!msg.message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(msg.email)) {
      note(form, 'Please enter your e-mail address and a message.');
      return;
    }
    if (!WEB3FORMS_KEY) {
      openMailApp(form, msg);
      return;
    }

    var trap = form.querySelector('[name="botcheck"]');
    var button = form.querySelector('button[type="submit"]');
    var label = button ? button.innerHTML : '';
    form.classList.add('is-sending');
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    note(form, '');

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: msg.subject,
        from_name: 'S-Clinical website',
        name: msg.name,
        email: msg.email,
        message: msg.message,
        page: location.href,
        botcheck: trap ? trap.checked : false
      })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.success) throw new Error(res.message);
      form.reset();
      note(form, 'Thank you, your message has been sent. We will get back to you soon.');
    }).catch(function () {
      openMailApp(form, msg);
    }).then(function () {
      form.classList.remove('is-sending');
      if (button) { button.disabled = false; button.innerHTML = label; }
    });
  }, true);
})();
