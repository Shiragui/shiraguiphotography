(function () {
  // Edit packages here — updates index.html and pricing.html automatically.
  const PACKAGES_HTML = `
    <header>
      <h2>Photography Packages</h2>
      <p>Explore my photography packages designed to fit different needs.
         Please note: Travel beyond 20 minutes may include an additional fee. 
         All sessions require a $50 deposit to secure the session date and remaining balance is due the day of the session.</p>
    </header>

    <div class="box">
      <h3>Solo Portrait, Seniors, or Solo Graduation Session</h3>
      <p><strong>Price:</strong> $250 for 1 hour<br>
      <strong>Overtime:</strong> $125 per additional half hour<br>
      <strong>Includes:</strong> Photos consistently edited (30+ photos), 1 week delivery, online gallery</p>

      <hr>

      <h3>Group Graduation Session</h3>
      <p><strong>Price:</strong>
      2–3 people: $145 each |
      4–5 people: $110 each |
      6–7 people: $85 each<br>
      <strong>Duration:</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 hour&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.5 hours&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.5 hours&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      <br>
      <strong>Includes:</strong> Group shots + individual portraits, photos consistently edited (60+ photos), 1 week delivery, online gallery</p>

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
