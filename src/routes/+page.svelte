<script lang="ts">
  import Background         from '$lib/components/Background.svelte'
  import ParticleBackground from '$lib/components/ParticleBackground.svelte'
  import Title              from '$lib/components/Title.svelte'
  import Indicator          from '$lib/components/Indicator.svelte'
  import Section            from '$lib/components/Section.svelte'
  import Circles            from '$lib/components/Circles.svelte'
  import About              from '$lib/components/About.svelte'
  import Stack              from '$lib/components/Stack.svelte'
  import Showcase           from '$lib/components/Showcase.svelte'
  import Contacts           from '$lib/components/Contacts.svelte'

  const indicator = { appearDelay: 3000, color: 'azure', width: 32, size: 32, showLabel: false }
</script>

<Circles appearDelay={3000} showLabel={true} />

<Section id="Головна" effect="blink" dotColor="azure">
  <Background sectionId="Головна" />
  <Title
    title='Вітаю!'
    subtitle='Мене звати Олександр'
    subtitle2='і я займаюсь веб-розробкою'
    maxTilt={3}
    lerpFactor={0.06}
    letterDelay={100}
    dropDistance={100}
  />
  <Indicator {...indicator} position="first" />
</Section>

<Section id="Про мене" effect="blink" dotColor="azure">
  <Background
    sectionId="Про мене"
    colorBg1='rgb(0,0,0)'    colorBg2='rgb(14,14,14)'
    color1='46,17,17'        color2='145,31,31'
    color3='146,0,42'        color4='119,21,21'
    color5='153,0,0'         colorInteractive='226,16,58'
  />
  <About />
  <Indicator {...indicator} position="middle" />
</Section>

<Section id="Роботи" effect="blink" dotColor="black">
  <Background
    sectionId="Роботи"
    colorBg1='rgb(64,64,81)'   colorBg2='rgb(40,32,45)'
    color1='208,208,208'       color2='248,248,248'
    color3='154,147,171'       color4='32,32,32'
    color5='255,241,153'       colorInteractive='195,164,195'
  />
  <Showcase />
  <Indicator {...indicator} position="middle" color="black" />
</Section>

<Section id="Стек" effect="blink" dotColor="azure">
  <ParticleBackground
    sectionId="Стек"
    bgColor='#2d3436'
    bgImage='linear-gradient(315deg, #2d3436 0%, #000000 74%)'
  />
  <Stack />
  <Indicator {...indicator} position="middle" />
</Section>

<Section id="Контакти" effect="blink" dotColor="black">
  <ParticleBackground
    sectionId="Контакти"
    bgColor='#bdcad9'
    bgImage='linear-gradient(315deg, #bdcad9 0%, #e1dada 74%)'
  />
  <Contacts />
  <Indicator {...indicator} position="last" color="black" />
</Section>

<style>
  :global(html) {
    /* scroll-snap-type: mandatory — works everywhere */
    scroll-snap-type: y mandatory;
    /* NO scroll-behavior: smooth here — it breaks snap on iOS Safari */
    /* NO timeline-scope — that's a Chrome-only CSS feature, killed mobile */
    overflow-y: scroll;
    overflow-x: hidden;
    /* Prevent elastic overscroll from hiding content on iOS */
    overscroll-behavior-y: none;
  }

  :global(body) {
    margin: 0;
    background: #0b0c0e;
    /* Ensure body doesn't block scroll */
    overflow: visible;
  }

  /* Native smooth scroll only on desktop where it doesn't fight iOS snap */
  @media (min-width: 801px) {
    :global(html) {
      scroll-behavior: smooth;
    }
  }
</style>