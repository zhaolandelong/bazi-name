import * as fs from "fs";
import { CharData, Ele, GBData, Sex } from "./types";
import { getGoodNums, getNameScore } from "./utils";
import chars from "./data/chars.json";
import basicNums from "./data/nums-basic.json";

interface Options {
  charsData: Record<string, CharData>;
  numsData: GBData[];
  surname: string;
  eles: Ele[];
  minScore?: number;
}

function main(options: Options) {
  const { charsData, numsData, surname, eles, minScore = 6 } = options;
  const surnameData = charsData[surname];
  const result: string[] = [];

  const surStks = surnameData.strokes;
  const chars = Object.values(charsData);
  const filterdNumsData = numsData.filter((data) => data.score >= minScore);

  const allGoodNums = Array.from(
    new Set(filterdNumsData.map((data) => data.nums).flat())
  );

  filterdNumsData.forEach((numData) => {
    numData.nums.forEach((num) => {
      const rest = num - surStks;
      if (rest > 1) {
        chars.forEach((secd) => {
          const manScore = surStks + secd.strokes;
          const lastRest = rest - secd.strokes;
          if (
            allGoodNums.includes(manScore) &&
            lastRest > 0 &&
            secd.ele === eles[0]
          ) {
            chars.forEach((last) => {
              const earthScore = secd.strokes + last.strokes;
              if (
                allGoodNums.includes(earthScore) &&
                last.ele === eles[1] &&
                lastRest === last.strokes
              ) {
                const { cosmos, man, earth, outside, total } = getNameScore({
                  surnameData,
                  secondNameData: secd,
                  lastnameData: last,
                });
                result.push(
                  `${secd.char}${last.char}（${secd.sound}，${last.sound}）：总${total}人${man}地${earth}天${cosmos}外${outside}`
                );
              }
            });
          }
        });
      }
    });
  });

  fs.writeFileSync("./result.json", JSON.stringify(result, null, 2));
}

const goodNums = getGoodNums(basicNums, Sex.female);

const options = {
  charsData: chars,
  numsData: goodNums,
  surname: "赵",
  eles: [Ele.fire, Ele.earth], // tu jin 98, jin tu 98, jin jin 91, tu tu 95,
  minScore: 4,
}

main(options);
