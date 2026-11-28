/* Edit this file to update the site.

   The page reads top to bottom in the order of `groups`, and each group
   reads top to bottom in the order of `nodes`. Newest work stays at the top.
   To add a project, copy a node into the group where it should appear.
   date is optional. Newest work stays at the top.

   Links are optional. Leave href as "" until you have a URL.
   A demo is optional. When you have one, set media to:
     { src: "media/demo.mp4", poster: "media/demo.jpg" }
   A .gif works in src as well. Put the file in a media folder.

   Header links use the same shape: { label: "GitHub", href: "https://..." }
   Resume can be { label: "Resume", href: "resume.pdf" }.
*/

window.PORTFOLIO = {
  name: "Dimitri",
  headline: "Software engineering student seeking C++ internships",
  lede: "C++ for concurrent systems and memory. Python for small web services.",
  links: [
    { label: "GitHub", href: "https://github.com/dkaly" },
    { label: "Email", href: "mailto:dimitrikalyi@gmail.com" },
    // { label: "Resume", href: "resume.pdf" },
  ],
  groups: [
    {
      id: "systems",
      label: "Systems",
      nodes: [
        {
          title: "Packet processing queue",
          date: "November 2026",
          summary: "A fixed-capacity circular buffer paired with a contiguous memory pool. Packets move as small descriptors, so the queue does not copy payloads or grow at runtime.",
          stack: "C++",
          href: "",
          media: null,
        },
        {
          title: "Order matching engine",
          date: "July 2026",
          summary: "Matches orders price-first, then time, including partial fills. A map holds price levels and a list keeps each level in arrival order.",
          stack: "C++ · STL · concurrency",
          href: "",
          media: null,
        },
      ],
    },
    {
      id: "applied",
      label: "Applied",
      nodes: [
        {
          title: "YouTube video summarizer",
          date: "May 2026",
          summary: "A Flask API that pulls a YouTube transcript and turns it into a structured summary with a GPT model.",
          stack: "Python · Flask · OpenAI · JavaScript",
          href: "",
          media: null,
        },
        {
          title: "RGDownloader",
          date: "July 2025 – present",
          summary: "A Flask site that turns a submitted video link into an MP4. yt-dlp and FFmpeg handle the extract and convert, and the service runs in production.",
          stack: "Python · Flask · FFmpeg",
          href: "https://rg-downloader.org",
          media: null,
        },
      ],
    },
    {
      id: "practice",
      label: "Practice",
      nodes: [
        {
          title: "EA Sports work simulation",
          date: "December 2025",
          summary: "Forage virtual experience. Proposed a feature, wrote the C++ class headers, and replaced a data structure to fix a performance bug.",
          stack: "C++",
          href: "",
          media: null,
        },
      ],
    },
    {
      id: "other",
      label: "Other projects",
      nodes: [
        {
          title: "Image to ASCII",
          summary: "OpenCV turns an image grayscale, then each pixel’s brightness maps to a character so the picture reads as ASCII text.",
          stack: "Python · OpenCV",
          href: "",
          media: null,
        },
        {
          title: "Lyrics teleprompter",
          summary: "Scrolls lyrics as ASCII art, teleprompter-style.",
          stack: "",
          href: "",
          media: null,
        },
      ],
    },
    {
      id: "about",
      label: "About",
      nodes: [
        {
          title: "Studies",
          summary: "Computer science student.",
          stack: "",
          href: "",
          media: null,
        },
        {
          title: "Coursework",
          summary: "Data structures and algorithms, discrete mathematics, and advanced programming, in C++. CS50 is in progress.",
          stack: "",
          href: "",
          media: null,
        },
        {
          title: "Internships",
          summary: "Looking for internships writing C++ close to the data: concurrency, memory, and backend systems.",
          stack: "",
          href: "",
          media: null,
        },
      ],
    },
  ],
};
