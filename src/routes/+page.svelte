<script lang="ts">
    import Background from "$lib/components/Background.svelte"
    import Title from "$lib/components/Title.svelte"
    import Indicator from "$lib/components/Indicator.svelte"
    import Section from "$lib/components/Section.svelte"
    import Circles from "$lib/components/Circles.svelte"
    import About from "$lib/components/About.svelte"
    import Stack from "$lib/components/Stack.svelte"
    import Showcase from "$lib/components/Showcase.svelte"
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
        letterDelay={100}
        dropDistance={100}
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
        colorBg1={'rgb(64,64,81)'}
        colorBg2={'rgb(40,32,45)'}
        color1={'208,208,208'}
        color2={'248,248,248'}
        color3={'154,147,171'}
        color4={'32,32,32'}
        color5={'255,241,153'}
        colorInteractive={'195,164,195'}
    />
    <Stack />
    <Indicator
        appearDelay={3000}
        color='azure'
        width={32}
        size={32}
        showLabel={false}
    />
</Section>

<Section id="Роботи" effect="blink">
    <Background 
        colorBg1={'rgb(106,93,110)'}
        colorBg2={'rgb(138,78,89)'}
        color1={'159,41,41'}
        color2={'117,18,40'}
        color3={'30,18,24'}
        color4={'133,90,92'}
        color5={'102,16,31'}
        colorInteractive={'138,142,145'}
    />
    <Showcase /> 
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