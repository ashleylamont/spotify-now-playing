export function createElementOrReplace<E extends HTMLElement>(
  tagName: string,
  id: string,
  parent: Element,
  innerText?: string,
  classList?: string[],
): E {
  let element = document.getElementById(id);
  if (element) {
    if (innerText !== undefined) element.innerText = innerText;
  } else {
    element = document.createElement(tagName);
    element.id = id;
    if (innerText !== undefined) element.innerText = innerText;
    if (classList) {
      element.classList.add(...classList);
    }
    parent.appendChild(element);
  }
  return element as E;
}

export function deleteElementWithId(id: string): void {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}
