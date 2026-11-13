<script>
  import NetworkBackground from './lib/NetworkBackground.svelte';

  // Only load a preview iframe once it scrolls near the viewport, so off-screen
  // external sites don't render and eat CPU while you scroll.
  function lazyIframe(node, src) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!node.src) node.src = src;
          io.disconnect();
          break;
        }
      }
    }, { rootMargin: '300px' });
    io.observe(node);
    return { destroy() { io.disconnect(); } };
  }
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
                  use:lazyIframe={"https://cs333finalproject.vercel.app/"}
                  title="International Students in the USA - Preview"
                  class="project-preview"
                  loading="lazy"
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
                  use:lazyIframe={"https://item-bleak-77544513.figma.site/"}
                  title="Focus Enhancement App UI/UX Prototype - Preview"
                  class="project-preview"
                  loading="lazy"
                ></iframe>
              </div>
            </article>
                        <article class="project">
              <h3 class="title-case">RackFlow</h3>
              <p>
                RackFlow is a platform for vintage and second-hand stores that automates inventory listing, tracking and selling. I’m building an AI agent that lets store owners run the platform by saying what they want, turning plain requests into inventory changes and API calls behind the scenes. Next it’ll read financial reports back to them, flag inventory errors and suggest what to do about them. Alongside that I fix UX bugs and ship them through the dev and production pipelines.
              </p>
              <a href="https://rackflow.studio/preview/dashboard/DashboardPage" target="_blank" rel="noopener noreferrer" class="project-link">View project →</a>
              <div class="preview-wrapper image-preview">
                <a href="https://rackflow.studio/preview/dashboard/DashboardPage" target="_blank" rel="noopener noreferrer">
                  <img src="/rackflow-preview.png" alt="RackFlow inventory dashboard preview" class="project-preview" loading="lazy" />
                </a>
              </div>
            </article>
            <article class="project">
              <h3 class="title-case">Glimmr</h3>
              <p>
                Glimmr is a shoe charm brand, and I look after how the storefront looks and works. I designed and built a Diwali-themed interface to draw new customers in, and I handle the seasonal redesigns that follow. I also keep the inventory current and make every change that goes live.
              </p>
              <a href="https://shopglimmr.in/" target="_blank" rel="noopener noreferrer" class="project-link">View project →</a>
              <div class="preview-wrapper image-preview glimmr-image-preview">
                <a href="https://shopglimmr.in/" target="_blank" rel="noopener noreferrer">
                  <img src="/glimmr-preview.png" alt="Glimmr Diwali storefront preview" class="project-preview" loading="lazy" />
                </a>
              </div>
            </article>
          </section>
        </div>
      </div>
    </div>
  </div>
</div>
