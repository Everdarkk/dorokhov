<!--
  Props:
    eyebrow        — small uppercase badge text (e.g. "про мене")
    title          — main h2 text; supports HTML via the `title` slot fallback
    titleSlot      — when true, renders <slot> instead of the `title` string
                     (use for multi-line / <br /> / mixed content)
    gradient       — CSS gradient string for the <em> accent
                     e.g. "linear-gradient(135deg, #e2103a 0%, #ff6b6b 50%, #c2002a 100%)"
    eyebrowColor   — override eyebrow text colour (default rgba(255,255,255,0.35))
    eyebrowBorder  — override eyebrow border colour (default rgba(255,255,255,0.12))
    titleColor     — base h2 colour for non-gradient text (default #fff)
    visible        — drives eyebrow entrance animation
    titleVisible   — drives title entrance animation
-->

<script lang="ts">
  export let eyebrow:       string          = ''
  export let gradient:      string          = 'linear-gradient(135deg, #fff 0%, #ccc 100%)'
  export let eyebrowColor:  string          = 'rgba(255,255,255,0.35)'
  export let eyebrowBorder: string          = 'rgba(255,255,255,0.12)'
  export let titleColor:    string          = '#fff'
  export let visible:       boolean         = false
  export let titleVisible:  boolean         = false
</script>

<!-- STRUCTURE -->
<header class="section-header">
  <span
    class="eyebrow"
    class:eyebrow--visible={visible}
    style="color: {eyebrowColor}; border-color: {eyebrowBorder};"
  >{eyebrow}</span>

  <h2
    class="section-title"
    class:section-title--visible={titleVisible}
    style="--title-gradient: {gradient}; color: {titleColor};"
  >
    <!--
      Default slot: lets each section pass its own title markup.
      e.g. <SectionHeader ...>Мої <em>роботи</em></SectionHeader>
      The <em> gets the gradient automatically via CSS.
    -->
    <slot />
  </h2>
</header>

<style>
  /* ── Header wrapper ── */
  .section-header {
    text-align: center;
    flex-shrink: 0;
  }

  /* ── Eyebrow badge ── */
  .eyebrow {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    border: 1px solid;          /* colour set via style attr */
    padding: 0.3em 1.1em;
    border-radius: 100px;
    backdrop-filter: blur(4px);
    margin-bottom: 0.6rem;

    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity   0.7s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .eyebrow--visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Main title ── */
  .section-title {
    font-family: 'Unbounded', sans-serif;
    font-size: clamp(1.5rem, 3.5vw, 2.8rem);
    font-weight: 700;
    line-height: 1.15;
    margin: 0;

    opacity: 0;
    transform: translateY(14px);
    transition:
      opacity   0.8s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .section-title--visible {
    opacity: 1;
    transform: translateY(0);
  }

  /*
    Gradient accent on <em> inside title.
    Each section passes its own gradient via the `gradient` prop → CSS var.
    font-style reset so <em> reads as a design element, not italic body text.
  */
  .section-title :global(em) {
    font-style: normal;
    background: var(--title-gradient, linear-gradient(135deg, #fff 0%, #ccc 100%));
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }

  @keyframes shimmer {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @media (max-width: 800px) {
    .eyebrow {
      font-size: 0.58rem;
      padding: 0.22em 0.75em;
      letter-spacing: 0.18em;
      margin-bottom: 0.35rem;
    }
    .section-title {
      font-size: clamp(1.15rem, 5.5vw, 1.75rem);
      line-height: 1.2;
    }
  }
</style>