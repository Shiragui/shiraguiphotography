(function () {
  const FORMSPREE_ACTION = "https://formspree.io/f/xvgaokwv";

  // Edit the heading + intro here — both index.html and contact.html use this.
  const CONTACT_INTRO = {
    title: "Book a session.",
    body: `Send an email below for booking!<br>I am in San Jose, CA until August 7th, 2026,
    will be in Hartland, Wisconsin until September 1st, and then in NYC after that.<br>Mention ideal dates, duration, 
    location, # of group members if possible!`,
  };

  // Edit the form fields/options here — both index.html and contact.html use this.
  const HOW_FOUND_OPTIONS = [
    { value: "instagram", label: "Instagram" },
    { value: "campus poster", label: "Campus Poster" },
    { value: "google", label: "Google search" },
    { value: "ai", label: "ChatGPT / AI search" },
    { value: "friend", label: "Friend / word of mouth" },
    { value: "columbia", label: "Columbia / campus group" },
    { value: "returning", label: "Returning client" },
    { value: "other", label: "Other" },
  ];

  function buildOptionsHtml() {
    return HOW_FOUND_OPTIONS.map(
      (opt) => `<option value="${opt.value}">${opt.label}</option>`
    ).join("");
  }

  function ensureContactSectionStyles() {
    if (document.getElementById("contact-section-styles")) return;

    const style = document.createElement("style");
    style.id = "contact-section-styles";
    style.textContent = `
      [data-contact-section] strong,
      [data-contact-section] b,
      [data-contact-section] h2,
      [data-contact-section] h3 {
        color: #005987;
      }
    `;
    document.head.appendChild(style);
  }

  function buildSectionHtml() {
    return `
      <div class="box">
        <header style="margin-bottom: 2em;">
          <h2>${CONTACT_INTRO.title}</h2>
          <p>${CONTACT_INTRO.body}</p>
        </header>

        <form class="contact-form" method="POST" action="${FORMSPREE_ACTION}">
          <input type="hidden" name="_captcha" value="false">
          <div class="fields">
            <div class="field half"><input type="text" name="name" placeholder="Name*" required></div>
            <div class="field half"><input type="email" name="email" placeholder="Email*" required></div>
            <div class="field half"><input type="tel" name="phone" placeholder="Phone Number*" required></div>
            <div class="field half"><input type="text" name="location" placeholder="Location*" required></div>
            <div class="field">
              <select name="how_found" class="how-found" required>
                <option value="" disabled selected>How did you find out about me?*</option>
                ${buildOptionsHtml()}
              </select>
            </div>
            <div class="field how-found-detail-field" style="display: none;">
              <input type="text" name="how_found_detail" class="how-found-detail" placeholder="Please share where you found me">
            </div>
            <div class="field"><textarea name="message" placeholder="Message*" rows="6" required></textarea></div>
          </div>
          <ul class="actions special">
            <li><input type="submit" value="Send Message"></li>
          </ul>
        </form>

        <div class="contact-thank-you" style="display: none; text-align: center;">
          <h3>Thank you for reaching out!</h3>
          <p>I'll get back to you as soon as I can.</p>
        </div>

        <div class="contact-direct" style="text-align: center; margin: 2rem 0;">
          <hr style="border: none; border-top: 1px solid #ccc; margin-bottom: 1rem;">
          <p>Or contact me directly via text for faster response time:</p>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=shiraxgui@gmail.com&su=Photography Inquiry&body=Hi Shira," target="_blank" class="button">Email Me</a>
            <a href="sms:+12622826616" class="button" target="_blank">Text Me</a>
          </div>
        </div>
      </div>
    `;
  }

  function initContactSection(container) {
    container.innerHTML = buildSectionHtml();

    const form = container.querySelector(".contact-form");
    const thankYou = container.querySelector(".contact-thank-you");
    const howFound = container.querySelector(".how-found");
    const howFoundDetailField = container.querySelector(".how-found-detail-field");
    const howFoundDetail = container.querySelector(".how-found-detail");

    function toggleHowFoundDetailField() {
      const needsDetail = howFound.value === "friend" || howFound.value === "other";
      howFoundDetailField.style.display = needsDetail ? "block" : "none";
      howFoundDetail.required = needsDetail;
      if (!needsDetail) {
        howFoundDetail.value = "";
      }
    }

    howFound.addEventListener("change", toggleHowFoundDetailField);
    toggleHowFoundDetailField();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const data = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      }).then((response) => {
        if (response.ok) {
          form.style.display = "none";
          thankYou.style.display = "block";
        } else {
          alert("Oops! Something went wrong. Please try again.");
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureContactSectionStyles();
    document.querySelectorAll("[data-contact-section]").forEach(initContactSection);
  });
})();
