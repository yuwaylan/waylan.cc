export type Media = {
  src: string;
  title: string;
  description: string;
  width: number;
  height: number;
};
export const beScreens: Media[] = [
  {
    src: 'be-nearby',
    title: '顧客端・附近工作室',
    description: '從地圖與作品瀏覽工作室，找到想預約的服務。',
    width: 900,
    height: 1833,
  },
  {
    src: 'be-calendar',
    title: '技師端・行事曆',
    description: '查看每日服務、預約狀態與可約空檔。',
    width: 900,
    height: 1833,
  },
  {
    src: 'be-booking',
    title: '顧客端・服務選擇',
    description: '查看服務價格與時長，選擇預約項目。圖為服務選單局部。',
    width: 900,
    height: 1150,
  },
  {
    src: 'be-customer-tags',
    title: '技師端・顧客標籤',
    description: '以標籤整理顧客。圖為功能局部，已裁去個人資料與紀錄。',
    width: 1000,
    height: 320,
  },
];
export const skinStages = [
  { src: 'skin-original', title: '原始影像', description: '輸入的微觀皮膚影像。' },
  { src: 'skin-prediction', title: '模型預測', description: '模型預測的紋理區域，以橘色標示。' },
  { src: 'skin-contour', title: '輪廓擷取', description: '從預測區域取得輪廓座標。' },
  { src: 'skin-overlay', title: '疊回原圖', description: '將輪廓疊在原始影像上，對照偵測位置。' },
];
