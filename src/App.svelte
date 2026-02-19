<script>
  import NetworkBackground from './lib/NetworkBackground.svelte';
</script>

<NetworkBackground />

<header id="header">
  <h1>Amie Masih</h1>
</header>

<div id="container">
  <div class="inner">
    <div id="content">
      <div id="home" class="content-region show">
        <div class="body-content">
          <p>
            I am a third-year computer science student with some industry experience in data science. My interest lies where data and impact overlap. In my projects, I have used my own experiences as a catalyst for building websites that support communities as a whole and streamline access to resources.
          </p>
          <p>
            Interested in web development for social impact and data-driven solutions? Let's talk!
          </p>
          <p>
            github: <a href="https://github.com/amiemasih">@amiemasih</a><br>
            email: <a href="mailto:amiemasih2027@u.northwestern.edu">amiemasih2027@u.northwestern.edu</a>
          </p>
        </div>

        <div class="projects-section">
          <section class="projects">
            <article class="project">
              <h3 class="title-case">International Students in the USA</h3>
              <p>
                Explore an interactive scrollytelling visualization that brings the story of international students in the U.S. to life using Open Doors data.
                This project uncovers trends in what students from different countries choose to study and interrogates common assumptions, such as whether Asian students are disproportionately represented in STEM compared to other regions. Scroll to discover how the data confirms, or challenges these narratives.
              </p>
              <a href="https://cs333finalproject.vercel.app/" target="_blank" rel="noopener noreferrer" class="project-link">View project →</a>
              <div class="preview-wrapper">
                <iframe
                  src="https://cs333finalproject.vercel.app/"
                  title="International Students in the USA - Preview"
                  class="project-preview"
                ></iframe>
              </div>
            </article>
            <article class="project">
              <h3 class="title-case">Focus Enhancement App</h3>
              <p>
                Explore a UI/UX prototype designed in Figma for a focus enhancement app grounded in behavioral psychology. This project explores how cognitive load, habit formation, and attention cues can be translated into thoughtful interface design to support sustained focus. Through intentional layout, interaction patterns, and feedback loops, the prototype aims to reduce distraction and encourage healthier productivity behaviors.
              </p>
              <a href="https://item-bleak-77544513.figma.site/" target="_blank" rel="noopener noreferrer" class="project-link">View project →</a>
              <div class="preview-wrapper">
                <iframe
                  src="https://item-bleak-77544513.figma.site/"
                  title="Focus Enhancement App UI/UX Prototype - Preview"
                  class="project-preview"
                ></iframe>
              </div>
            </article>
            <article class="project project-full-width">
              <h3 class="title-case">Northwestern University International First-Generation Student Platform</h3>
              <p>
                This is Northwestern's first-ever centralized web resource for international first-generation, low-income students.
                In collaboration with Northwestern's Undergraduate International Student Advancement Council, the Office of International Students, and the Financial Aid Office, this website aims to make navigating institutional resources clearer, faster, and more equitable. Designed around real student journeys, the platform surfaces relevant academic, immigration, and financial resources within just a few clicks. Explore Northwestern's Undergraduate International Student Advancement Council's mission here: <a href="https://www.instagram.com/uisacnu/" target="_blank" rel="noopener noreferrer">@uisacnu</a>
              </p>
              <span class="project-link-coming-soon">Website link coming soon!</span>
            </article>
          </section>
        </div>
      </div>
    </div>
  </div>
</div>
