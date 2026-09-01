(function () {
  // Edit packages here — updates index.html and pricing.html automatically.
  const PACKAGES_HTML = `
    <header>
      <h2>Photography Packages</h2>
      <p>Explore my photography packages designed to fit different needs and budgets.
         Whether you're looking for a quick session or an in-depth experience,
         there's something here for everyone. Please note: Travel beyond 20 minutes may include an additional fee.</p>
    </header>

    <div class="box">
      <h3>Solo Portrait, Seniors, or Solo Graduation Session</h3>
      <p><strong>Price:</strong> $225 for 1 hour<br>
      <strong>Overtime:</strong> $100 per additional half hour<br>
      <strong>Includes:</strong> Photos consistently edited (40+ photos), 1 week delivery, online gallery</p>

      <hr>

      <h3>Group Graduation Session</h3>
      <p><strong>Price:</strong>
      2–3 people: $120 each |
      4–5 people: $90 each |
      6–7 people: $70 each<br>
      <strong>Duration:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 hour&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.5 hours&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.5 hours&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <br>
      <strong>Includes:</strong> Group shots + individual portraits, photos consistently edited (80+ photos), 1 week delivery, online gallery</p>

      <hr>

      <h3>Event Coverage: Weddings, Parties, Socials, Formals</h3>
      <p><strong>Price:</strong> $200 per hour (not including travel fee) 2-hour minimum<br>
      <strong>Includes:</strong> Candid and posed shots from events like weddings, parties, socials, or formals, all photos consistently edited, delivery within 2 weeks.</p>

      <hr>

      <h3>Custom Sessions</h3>
      <p><strong>Contact me</strong> for a personalized quote! I'm open to family shoots, birthday parties, or any other special occasions you would like to have captured.</p>
    </div>
  `;

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-packages-section]").forEach(function (el) {
      el.innerHTML = PACKAGES_HTML;
    });
  });
})();
