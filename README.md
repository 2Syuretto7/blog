# blog.arnavraja.in
The same upright, paper-white Alto screen as stuff.arnavraja.in. Every post is a document window; a post's own address brings its window to the front.

To publish: add a file to `_posts/` named `YYYY-MM-DD-some-title.md`:

    ---
    title: Some title
    ---
    Your words here.

Commit it (the GitHub website's "Add file" button works) and it is live in about a minute. The newest post opens on top.

## Writing maths, code and results

- Maths: `$$\nabla_\theta L$$` inside a sentence; a line holding only `$$ ... $$` (with blank lines around it) for a displayed equation. Any LaTeX that KaTeX supports.
- Code: fenced blocks with a language, e.g. ```` ```python ````. Highlighted on the page.
- Tables: GitHub-style pipe tables.
- Footnotes: `claim[^1]` and later `[^1]: The source.`
- Figures: `![A plot of the loss](/assets/loss.png)`; put images in an `assets` folder.
