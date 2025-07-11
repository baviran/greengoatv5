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
  margin: 1rem 0;
}

ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  padding-left: 0;
  flex-direction: row;
}

/* Custom styled checkboxes for PDF */
ul[data-type="taskList"] li label {
  position: relative;
  padding-top: 2px;
  padding-left: 0;
  margin-left: 0.75rem;
  margin-right: 0;
  display: flex;
  align-items: center;
}

ul[data-type="taskList"] input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

ul[data-type="taskList"] input[type="checkbox"] + span {
  display: block;
  width: 1em;
  height: 1em;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  position: relative;
  cursor: pointer;
  background-color: #f9fafb;
  flex-shrink: 0;
}

ul[data-type="taskList"] input[type="checkbox"] + span::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.75em;
  height: 0.75em;
  background-color: white;
  opacity: 0;
  -webkit-mask: url("data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.4142%204.58579C22.1953%205.36683%2022.1953%206.63317%2021.4142%207.41421L10.4142%2018.4142C9.63317%2019.1953%208.36684%2019.1953%207.58579%2018.4142L2.58579%2013.4142C1.80474%2012.6332%201.80474%2011.3668%202.58579%2010.5858C3.36683%209.80474%204.63317%209.80474%205.41421%2010.5858L9%2014.1716L18.5858%204.58579C19.3668%203.80474%2020.6332%203.80474%2021.4142%204.58579Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat;
  mask: url("data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22currentColor%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M21.4142%204.58579C22.1953%205.36683%2022.1953%206.63317%2021.4142%207.41421L10.4142%2018.4142C9.63317%2019.1953%208.36684%2019.1953%207.58579%2018.4142L2.58579%2013.4142C1.80474%2012.6332%201.80474%2011.3668%202.58579%2010.5858C3.36683%209.80474%204.63317%209.80474%205.41421%2010.5858L9%2014.1716L18.5858%204.58579C19.3668%203.80474%2020.6332%203.80474%2021.4142%204.58579Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E") center/contain no-repeat;
}

ul[data-type="taskList"] input[type="checkbox"]:checked + span {
  background: #1f2937;
  border-color: #1f2937;
}

ul[data-type="taskList"] input[type="checkbox"]:checked + span::before {
  opacity: 1;
}

ul[data-type="taskList"] li > div {
  flex: 1;
  min-width: 0;
  padding-right: 0.75rem;
}

/* Checked item text styling */
ul[data-type="taskList"] li[data-checked="true"] p {
  opacity: 0.5;
  text-decoration: line-through;
}

ul[data-type="taskList"] li[data-checked="true"] p span {
  text-decoration: line-through;
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