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
  // Short-video captions: one word or phrase at a time. Japanese particles stay with the word before them.
  const particle=/^[ぁ-ゖー]{1,3}$/u;
  function splitWords(text){
    const line=String(text||'');
    let tokens;
    try{tokens=[...new Intl.Segmenter('ja',{granularity:'word'}).segment(line)].map(s=>({text:s.segment,index:s.index,word:s.isWordLike}));}
    catch(e){tokens=(line.match(/\S+\s*/gu)||[]).map(t=>({text:t,index:line.indexOf(t),word:true}));}
    const chunks=[];
    for(const token of tokens){
      const last=chunks.at(-1),bare=token.text.trim();
      if(!bare){if(last)last.text+=token.text;continue;}
      const japanese=/[\u3040-\u30ff\u3400-\u9fff]/u.test(bare);
      // Punctuation, particles and tiny kana tails join the previous chunk if it is still short.
      if(last&&(!token.word||(japanese&&particle.test(bare)&&[...last.text.trim()].length<7))){last.text+=token.text;continue;}
      chunks.push({text:token.text,index:token.index});
    }
    return chunks.map(c=>({text:c.text.trim(),index:c.index})).filter(c=>c.text);
  }
  root.tsukiSplitWords=splitWords;
  root.tsukiSplitLyrics=splitLyrics;
  root.tsukiFitLine=fitLine;
})(typeof window==='undefined'?globalThis:window);
