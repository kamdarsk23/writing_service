import { useState } from 'react';

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="px-1 py-0.5 rounded border border-gray-300 bg-gray-50 text-[11px] font-sans text-gray-700">
      {children}
    </kbd>
  );
}

export function GuideButton() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Guide"
        aria-expanded={open}
        className="w-5 h-5 rounded-full border border-gray-400 text-gray-600 text-xs leading-none flex items-center justify-center hover:bg-gray-100"
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 pt-1">
          <div
            role="region"
            aria-label="Guide"
            className="w-96 max-h-[70vh] overflow-y-auto bg-white border rounded shadow-lg p-4 text-sm text-gray-700"
          >
            <h2 className="font-semibold text-gray-900 mb-2">Guide</h2>

            <section className="mb-3">
              <h3 className="font-medium text-gray-900">Work</h3>
              <p className="mt-0.5">
                A saved piece of writing. It has a title and lives in your workspace, or inside a folder.
                Open the card to write. <Kbd>⌘D</Kbd> or <Kbd>Ctrl+S</Kbd> saves it and brings you back.
                <Kbd>⌘E</Kbd> or <Kbd>Ctrl+L</Kbd> leaves without saving.
              </p>
            </section>

            <section className="mb-3">
              <h3 className="font-medium text-gray-900">Q tree</h3>
              <p className="mt-0.5">
                A question with an answer, and more questions under it. The top card is the root question.
                <Kbd>+</Kbd> adds a child question. Open a card to edit the question and write the answer under it.
                <Kbd>⌘D</Kbd> saves and returns to the tree. <Kbd>⌘E</Kbd> leaves without saving.
              </p>
            </section>

            <section className="mb-3">
              <h3 className="font-medium text-gray-900">Free</h3>
              <p className="mt-0.5">
                From <Kbd>+ New</Kbd>, Free opens a blank writing page. It is not a work: it has no name, and nothing you type is stored.
                There is no save. <Kbd>⌘E</Kbd> or <Kbd>Ctrl+L</Kbd> exits.
              </p>
            </section>

            <section className="mb-3">
              <h3 className="font-medium text-gray-900">Folders</h3>
              <p className="mt-0.5">
                Folders hold works and Q trees. Right-click a folder, work, or Q tree to rename it, move it, or delete it.
              </p>
            </section>

            <section className="mb-3">
              <h3 className="font-medium text-gray-900">While you write</h3>
              <ul className="mt-1 space-y-1">
                <li><Kbd>⌘/</Kbd> larger text</li>
                <li><Kbd>⌘.</Kbd> smaller text</li>
                <li><Kbd>Tab</Kbd> indent, or nest a list item</li>
                <li><Kbd>Shift+Tab</Kbd> outdent</li>
                <li><Kbd>Backspace</Kbd> at the start of an indented line outdents</li>
                <li><Kbd>Backspace</Kbd> at the start of a heading turns it into a normal paragraph</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium text-gray-900">At the start of a line</h3>
              <ul className="mt-1 space-y-1">
                <li><Kbd>- </Kbd> or <Kbd>* </Kbd> bullet list</li>
                <li><Kbd>1. </Kbd> or <Kbd>1) </Kbd> numbered list</li>
                <li><Kbd>/h1 </Kbd> or <Kbd># </Kbd> heading</li>
                <li><Kbd>/h2 </Kbd> or <Kbd>## </Kbd> smaller heading</li>
                <li><Kbd>&gt; </Kbd> quote</li>
                <li><Kbd>```</Kbd> code block</li>
                <li><Kbd>---</Kbd> a line across the page</li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
