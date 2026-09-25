/* Split one recognized phrase into legible lyric lines while keeping punctuation. */
(function(root){
  'use strict';
  const weight=ch=>/[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/u.test(ch)?1.5:1;
  const width=text=>[...text].reduce((n,ch)=>n+weight(ch),0);
  const limit=34;
  function fit(text){
    const out=[];let current='';
    const japanese=/[\u3040-\u30ff\u3400-\u9fff]/u.test(text);
    const words=japanese?[...text]:text.match(/\S+\s*/gu)||[];
    for(const token of words){
      if(current&&width(current+token)>limit){
        if(japanese&&width(current)>limit*.62){
          const mark=Math.max(current.lastIndexOf('は'),current.lastIndexOf('が'),current.lastIndexOf('を'),current.lastIndexOf('に'),current.lastIndexOf('で'),current.lastIndexOf('と'),current.lastIndexOf('へ'));
          if(mark>current.length*.63&&mark<current.length-1){out.push(current.slice(0,mark+1).trim());current=current.slice(mark+1);}
        }
        if(current&&width(current+token)>limit){out.push(current.trim());current='';}
      }
      if(width(token)>limit){
        for(const ch of token){if(current&&width(current+ch)>limit){out.push(current.trim());current='';}current+=ch;}
      }else current+=token;
    }
    if(current.trim())out.push(current.trim());
    return out;
  }
  function splitLyrics(text){
    const result=[];
    for(const line of String(text||'').split(/\r?\n/u)){
      // Sentence and clause endings stay attached to the preceding words.
      const clauses=line.match(/[^.!?。！？、，,;；]+[.!?。！？、，,;；]*/gu)||[];
      for(const clause of clauses){
        const japanese=/[\u3040-\u30ff\u3400-\u9fff]/u.test(clause);
        const units=japanese?clause.split(/\s+/u):[clause];
        const phrases=[];
        for(const unit of units){
          const part=unit.trim();if(!part)continue;
          // A number or one-character fragment belongs with the preceding phrase.
          if(width(part)<4&&phrases.length)phrases[phrases.length-1]+=' '+part;
          else phrases.push(part);
        }
        if(phrases.length>1&&width(phrases[0])<4){const first=phrases.shift();phrases[0]=first+' '+phrases[0];}
        for(const phrase of phrases)result.push(...fit(phrase));
      }
    }
    return result.filter(Boolean);
  }
  // Hand-typed lines keep the user's line breaks; only lines too long for the screen are divided.
  function fitLine(text){
    const line=String(text||'').trim();
    if(!line)return [];
    return width(line)>limit?splitLyrics(line):[line];
  }
  root.tsukiSplitLyrics=splitLyrics;
  root.tsukiFitLine=fitLine;
})(typeof window==='undefined'?globalThis:window);
