<script lang="ts">
  import Background from '$lib/components/Background.svelte'
  import Title      from '$lib/components/Title.svelte'
  import Indicator  from '$lib/components/Indicator.svelte'
  import Section    from '$lib/components/Section.svelte'
  import Circles    from '$lib/components/Circles.svelte'
  import About      from '$lib/components/About.svelte'
  import Stack      from '$lib/components/Stack.svelte'
  import Showcase   from '$lib/components/Showcase.svelte'
  import Contacts from '$lib/components/Contacts.svelte'
  import ParticleBackground from '$lib/components/ParticleBackground.svelte'

  // Shared Indicator props — same on every section
  const indicator = { appearDelay: 3000, color: 'azure', width: 32, size: 32, showLabel: false }
</script>

<Circles appearDelay={3000} showLabel={true} />

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
  <Indicator {...indicator} />
</Section>

<Section id="Про мене" effect="blink">
  <Background
    colorBg1='rgb(0,0,0)'    colorBg2='rgb(14,14,14)'
    color1='46,17,17'        color2='145,31,31'
    color3='146,0,42'        color4='119,21,21'
    color5='153,0,0'         colorInteractive='226,16,58'
  />
  <About />
  <Indicator {...indicator} />
</Section>

<Section id="Роботи" effect="blink">
  <Background
    colorBg1='rgb(64,64,81)'   colorBg2='rgb(40,32,45)'
    color1='208,208,208'       color2='248,248,248'
    color3='154,147,171'       color4='32,32,32'
    color5='255,241,153'       colorInteractive='195,164,195'
  />
  <Showcase />
  <Indicator {...indicator} />
</Section>

<Section id="Стек" effect="blink">
  <ParticleBackground 
    bgColor='#2d3436'
    bgImage='linear-gradient(315deg, #2d3436 0%, #000000 74%)'
  />
  <Stack />
  <Indicator {...indicator} />
</Section>

<Section id="Контакти" effect="blink">
  <ParticleBackground
    bgColor='#bdcad9'
    bgImage='linear-gradient(315deg, #bdcad9 0%, #e1dada 74%)'
  />
  <Contacts />
  <Indicator />
</Section>

<style>
  :global(html) {
    scroll-snap-type: y mandatory;
    timeline-scope: --section;
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    background: #0b0c0e;
  }
</style>