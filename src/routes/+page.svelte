<script lang="ts">
    import Background from "$lib/components/Background.svelte"
    import Title from "$lib/components/Title.svelte"
    import Indicator from "$lib/components/Indicator.svelte"
    import Section from "$lib/components/Section.svelte"
    import Circles from "$lib/components/Circles.svelte"
    import About from "$lib/components/About.svelte"
</script>

<!-- STRUCTURE -->
<Circles 
    appearDelay={3000} 
    showLabel={true}
/>

<!--
  Each <Section> takes 100dvh in the normal flow (for snapping + view-timeline).
  Its inner .content is position: fixed, so sections cross-fade without
  a visible page scroll
-->

<Section id="Головна" effect="blink">
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

<Section id="Про мене" effect="blink">
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
    <About /> 
    <Indicator
        appearDelay={3000}
        color='azure'
        width={32}
        size={32}
        showLabel={false}
    />
</Section>

<Section id="Стек" effect="blink">
    <Background 
        colorBg1={'rgb(0,255,195)'}
        colorBg2={'rgb(92,255,217)'}
        color1={'144,255,229'}
        color2={'192,255,240'}
        color3={'231,255,249'}
        color4={'79,250,184'}
        color5={'148,250,211'}
        colorInteractive={'0,250,154'}
    />

    <Indicator
        appearDelay={3000}
        color='azure'
        width={32}
        size={32}
        showLabel={false}
    />
</Section>

<!-- STYLE -->
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