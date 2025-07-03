export const PDF_STYLES = `
/* Base layout */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  direction: rtl;
  text-align: right;
  color: #1f2937;
  background-color: white;
  padding: 2rem;
  margin: 0;
}

/* Headings */
h1, h2, h3 {
  color: #111827;
  margin: 2rem 0 1rem;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
}

h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

h3 {
  font-size: 1.25rem;
  font-weight: 500;
}

/* Paragraphs */
p {
  margin: 1rem 0;
}

/* Links */
a {
  color: #3b82f6;
  text-decoration: underline;
}

a:hover {
  text-decoration: none;
}

/* Highlight (mark) */
mark {
  background-color: #bbf7d0;
  padding: 0 0.2em;
}

/* Blockquotes */
blockquote {
  border-right: 4px solid #e5e7eb;
  padding: 1rem;
  margin: 2rem 0;
  background-color: #f9fafb;
  font-style: italic;
}

/* Lists */
ul, ol {
  margin: 1rem 0 1rem 0;
  padding-inline-start: 1.25rem;
}

li {
  margin: 0.5rem 0;
}

/* Task list support */
ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
}

ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

ul[data-type="taskList"] input[type="checkbox"] {
  margin-inline-start: 0.25rem;
  margin-inline-end: 0.75rem;
  transform: scale(1.2);
}

/* Horizontal rule */
hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}

/* Images */
img {
  max-width: 100%;
  height: auto;
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.06);
}
`

export const generatePDFHTML = (
  content: string, 
  title: string = 'PDF',
  customStyles?: string
): string => {
  const styles = customStyles || PDF_STYLES
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>${styles}</style>
  </head>
  <body>${content}</body>
</html>`
}