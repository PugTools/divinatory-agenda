import { Cruz, Odu } from "@/types/divination";
import { ODUS } from "@/data/odus";

const getOdu = (num: number): Odu => {
  const found = ODUS.find(o => o.number === num);
  return found || {
    number: num,
    name: `Odù ${num}`,
    short: '',
    descricao: '',
    orixas: [],
    ebos: [],
    icon: ''
  };
};

const reduce = (n: number): number => {
  let v = n;
  while (v > 16) {
    v = v.toString().split('').map(Number).reduce((a, b) => a + b, 0);
  }
  return v === 0 ? 16 : v;
};

export const calculateCruz = (birthdate: string): Cruz => {
  const parts = birthdate.split('T')[0].split('-'); // [yyyy,mm,dd]
  if (parts.length !== 3) {
    throw new Error('Invalid birthdate format');
  }

  const [yyyy, mm, dd] = parts;
  const digits = (dd + mm + yyyy).split('').map(ch => parseInt(ch, 10) || 0);
  
  while (digits.length < 8) digits.unshift(0);

  const col1 = digits[0] + digits[2] + digits[4] + digits[5];
  const col2 = digits[1] + digits[3] + digits[6] + digits[7];

  const top = reduce(col1);
  const base = reduce(col2);
  const left = reduce(col1 + col2);
  const right = reduce((col1 + col2) + left);
  const center = reduce((col1 + col2 + left + right));

  return {
    top: getOdu(top),
    base: getOdu(base),
    left: getOdu(left),
    right: getOdu(right),
    center: getOdu(center)
  };
};
