<script lang="ts">
    import Background from "$lib/components/Background.svelte"
    import Title from "$lib/components/Title.svelte"
    import Indicator from "$lib/components/Indicator.svelte"
    import Section from "$lib/components/Section.svelte"
    import Circles from "$lib/components/Circles.svelte"
</script>

<!-- STRUCTURE -->
<Circles 
    appearDelay={1000} 
    showLabel={true}
/>

<!--
  Each <Section> takes 100dvh in the normal flow (for snapping + view-timeline).
  Its inner .content is position: fixed, so sections cross-fade without
  a visible page scroll — exactly like the Giana codepen.

  Add as many <Section> blocks as you need. Mix effect types freely.
-->

<Section id="hero" effect="blink">
    <Background />
    <Title
        title='Вітаю!'
        subtitle='Мене звати Олександр'
        subtitle2='і я займаюсь веб-розробкою'
        maxTilt={3}
        lerpFactor={0.06}
    />
    <Indicator
        appearDelay={3000}
        color='azure'
        width={32}
        size={32}
        showLabel={false}
    />
</Section>

<Section id="next" effect="blink">
    <Background 
        colorBg1={'rgb(0,0,0)'}
        colorBg2={'rgb(14,14,14)'}
        color1={'46,17,17'}
        color2={'145,31,31'}
        color3={'146,0,42'}
        color4={'119,21,21'}
        color5={'153,0,0'}
        colorInteractive={'226,16,58'}
    />
    <Indicator
        appearDelay={3000}
        color='azure'
        width={32}
        size={32}
        showLabel={false}
    />
</Section>
export let colorBg1: string = 'rgb(0,0,0)';
  export let colorBg2: string = 'rgb(14,14,14)';
  
  export let color1: string = '46,17,17';
  export let color2: string = '145,31,31';
  export let color3: string = '146,0,42';
  export let color4: string = '119,21,21';
  export let color5: string = '153,0,0'
  export let colorInteractive: string = '226,16,58';

<!-- Add your next sections here, e.g.: -->
<!-- <Section id="about"   effect="blink"> ... </Section> -->
<!-- <Section id="work"    effect="slide"> ... </Section> -->
<!-- <Section id="contact" effect="zoom">  ... </Section> -->

<style>
    :global(html) {
        /* Snap container */
        scroll-snap-type: y mandatory;

        /*
          Expose the named timeline to the entire document.
          Add a new --section entry here if you ever need a
          *different* timeline name per section.
        */
        timeline-scope: --section;

        /* Smooth keyboard/anchor scrolling */
        scroll-behavior: smooth;
    }

    :global(body) {
        margin: 0;
        /* Match Section's --section-bg so edges never flash */
        background: #0b0c0e;
    }
</style>