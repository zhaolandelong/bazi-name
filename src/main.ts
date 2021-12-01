import * as fs from "fs";
import * as inquirer from "inquirer";
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
  return result;
}

inquirer
  .prompt([
    {
      type: "input",
      name: "surname",
      message: "姓氏（surname）：",
      validate(input) {
        if (/^[\u4e00-\u9fa5]$/.test(input)) {
          return true;
        }
        return new Error("暂时只支持中文单姓");
      },
    },
    {
      type: "list",
      name: "sex",
      message: "性别（sex）：",
      choices: [
        { name: "女（female）", value: Sex.female },
        { name: "男（male）", value: Sex.male },
      ],
    },
    {
      type: "list",
      name: "secdEle",
      message: "中间（第二个）字的属性（The element of middle char）：",
      choices: [
        { name: "木（wood）", value: Ele.wood },
        { name: "火（fire）", value: Ele.fire },
        { name: "土（earth）", value: Ele.earth },
        { name: "金（metal）", value: Ele.metal },
        { name: "水（water）", value: Ele.water },
      ],
    },
    {
      type: "list",
      name: "lastEle",
      message: "最后一个字的属性（The element of last char）：",
      choices: [
        { name: "木（wood）", value: Ele.wood },
        { name: "火（fire）", value: Ele.fire },
        { name: "土（earth）", value: Ele.earth },
        { name: "金（metal）", value: Ele.metal },
        { name: "水（water）", value: Ele.water },
      ],
    },
    {
      type: "list",
      name: "minScore",
      message: "筛选严格程度（Screening criteria）：",
      default: 1,
      choices: [
        { name: "极严（highest）", value: 6 },
        { name: "严格（high）", value: 4 },
        { name: "普通（normal）", value: 2 },
        { name: "低（low）", value: 0 },
      ],
    },
  ])
  .then((answsers) => {
    const { surname, sex, secdEle, lastEle, minScore } = answsers;

    const goodNums = getGoodNums(basicNums, sex);

    const options = {
      charsData: chars,
      numsData: goodNums,
      surname,
      eles: [secdEle, lastEle],
      minScore,
    };

    const result = main(options);

    const fileName = `./result-${surname}-${Ele[secdEle]}-${Ele[lastEle]}-${Sex[sex]}-${minScore}.json`;
    
    console.log(`成功：请查看 ${fileName} 文件（Success: Please watch the file）。`);

    fs.writeFileSync(fileName, JSON.stringify(result, null, 2));
  })
  .catch((e) => {
    console.error(e);
  });
