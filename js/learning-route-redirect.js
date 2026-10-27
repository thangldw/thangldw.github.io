const destinations = {
  "": "/apps/?group=learning",
  "disclaimer": "/disclaimer/",
  "g": "/g-kentei/",
  "fp3": "/fp3/",
  "bjt": "/bjt/",
  "sg": "/sg/",
  "ap": "/ap/",
  "jlpt": "/jlpt-n1/",
  "toeic": "/toeic/",
  "pmp": "/pmp/",
  "aws": "/aws/",
  "gh-300": "/gh-300/",
  "ccar-f": "/ccar-f/",
  "fp2": "/fp2/",
  "fe": "/fe/",
  "tokei-2": "/tokei-2/",
  "nw": "/nw/",
  "sc": "/sc/",
  "db": "/db/",
  "boki1": "/boki1/",
  "boki2": "/boki2/",
  "boki3": "/boki3/",
  "aws-aip-c01": "/aws-aip-c01/",
  "hsk-3-0": "/hsk-3-0/",
  "aws-dea-c01": "/aws-dea-c01/",
  "n1-modules/n1-grammar-exams": "/jlpt-n1/?skill=grammar-choice",
  "n1-modules/n1-grammar-flashcards": "/jlpt-n1/?skill=grammar-choice",
  "n1-modules/n1-grammar-sentence-order": "/jlpt-n1/?skill=grammar-order",
  "n1-modules/n1-grammar-sentence-order-drill": "/jlpt-n1/?skill=grammar-order",
  "n1-modules/n1-kanji-analysis": "/jlpt-n1/?skill=kanji-reading",
  "n1-modules/n1-kanji-collocations": "/jlpt-n1/?skill=vocabulary-usage",
  "n1-modules/n1-reading-75": "/jlpt-n1/?skill=reading-short",
  "n1-modules/n1-reading-library": "/jlpt-n1/?skill=reading-medium",
  "n1-modules/n1-reading-mondai9": "/jlpt-n1/?skill=reading-medium",
  "n1-modules/n1-vocabulary-context": "/jlpt-n1/?skill=vocabulary-context",
  "n1-modules/n1-vocabulary-exams": "/jlpt-n1/?skill=vocabulary-context",
  "n1-modules/n1-vocabulary-paraphrase": "/jlpt-n1/?skill=vocabulary-paraphrase",
  "n1-modules/n1-vocabulary-tabs": "/jlpt-n1/?skill=vocabulary-usage"
};
const prefix = ['/cert/', '/apps/cert/'].find(value => location.pathname.startsWith(value));
if (prefix || ['/cert', '/apps/cert'].includes(location.pathname)) {
 const suffix = prefix ? location.pathname.slice(prefix.length).replace(/(?:\/)?index\.html$/, '').replace(/\/+$/, '') : '';
 if (Object.hasOwn(destinations, suffix)) {
  const target = new URL(destinations[suffix], location.origin);
  new URLSearchParams(location.search).forEach((value, key) => target.searchParams.set(key, value));
  target.hash = location.hash;
  location.replace(target.pathname + target.search + target.hash);
 }
}
