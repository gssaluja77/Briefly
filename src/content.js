/* global chrome */

const extractText = () => {
  const allParas = [];
  const allParaNodes = document.querySelectorAll("p");
  const allDivNodes = document.querySelectorAll("div");
  
  allParaNodes.forEach((node) => {
    allParas.push(node.innerText);
  });
  
  allDivNodes.forEach((node) => {
    allParas.push(node.innerText);
  });
  
  return allParas.join("\n");
};

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const extractedText = extractText();
    sendResponse({ extractedText });
  }
});
