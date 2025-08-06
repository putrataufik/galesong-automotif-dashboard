// src/app/shared/mock/master-data.ts
import { CompanyBranch } from './interfaces';

export const COMPANIES: CompanyBranch[] = [
  {
    company: 'sinar-galesong-mandiri',
    branches: [
      'suzuki-urip-sumoharjo',
      'suzuki-yos-sudarso',
      'suzuki-aeropala',
      'suzuki-gowa',
    ],
  },
  {
    company: 'sinar-galesong-prima',
    branches: ['cabang-bitung', 'cabang-manado', 'cabang-kotamobagu'],
  },
  {
    company: 'sinar-galesong-automobil',
    branches: ['mg-pettarani', 'mg-kairagi'],
  },
  {
    company: 'sinar-galesong-mobilindo',
    branches: [
      'hyundai-pettarani',
      'hyundai-gorontalo',
      'hyundai-palu',
      'hyundai-kendari',
      'hyundai-palopo',
      'hyundai-sungguminasa',
    ],
  },
];

export const CATEGORIES = ['sales', 'after-sales'];