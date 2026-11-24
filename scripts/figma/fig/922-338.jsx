const assetPathPrefix = "https://www.figma.com/api/mcp/asset/25b19a9b-2d52-4cd8-8691-bba2fc1ea826";
const imgEllipse22 = `${assetPathPrefix}/bf7cd.svg`;
const imgVector11 = `${assetPathPrefix}/d8d60.svg`;
const imgGroup = `${assetPathPrefix}/d73ad.svg`;
const imgEllipse23 = `${assetPathPrefix}/2e2f8.svg`;
const imgEllipse27 = `${assetPathPrefix}/12a6c.svg`;
const imgEllipse24 = `${assetPathPrefix}/09edb.svg`;
const imgEllipse25 = `${assetPathPrefix}/6dd35.svg`;
const imgEllipse26 = `${assetPathPrefix}/8ac7f.svg`;

export default function Component() {
  return (
    <div className="bg-white relative size-full" data-node-id="922:338" data-name="트랜지션">
      <div className="absolute bg-[var(--base\/white,white)] h-[900px] left-0 overflow-clip top-0 w-[1440px]" data-node-id="922:339" data-name="02 문제 정의 → 해결 (Before / After)">
        <div className="absolute left-[-94.6px] size-[576.726px] top-[124.64px]" data-node-id="939:1740">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse22} />
        </div>
        <div className="absolute h-[178.384px] left-[154.33px] top-[520.82px] w-[1187.628px]" data-node-id="939:1745">
          <div className="absolute inset-[-1.4%_-0.21%_-1.36%_-0.21%]">
            <img alt="" className="block max-w-none size-full" src={imgVector11} />
          </div>
        </div>
        <div className="absolute contents inset-[48.17%_37.09%_5.6%_36.48%]" data-node-id="939:1733">
          <div className="absolute inset-[48.17%_37.09%_5.6%_36.48%]" data-node-id="939:1734" data-name="Group">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
          </div>
        </div>
        <div className="absolute left-[1170.45px] size-[325.36px] top-[641.56px]" data-node-id="939:1741">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse23} />
        </div>
        <div className="absolute left-[418.77px] size-[50.243px] top-[74.4px]" data-node-id="939:1774">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse27} />
        </div>
        <div className="absolute left-[1088.97px] size-[162.963px] top-[175.96px]" data-node-id="939:1742">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse24} />
        </div>
        <div className="absolute left-[443.89px] size-[162.963px] top-[803.95px]" data-node-id="939:1743">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse25} />
        </div>
        <div className="absolute left-[-17.71px] size-[162.963px] top-[765.04px]" data-node-id="939:1744">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse26} />
        </div>
      </div>
      <div className="-translate-x-1/2 absolute bg-[var(--purple\/500,#7550d3)] content-stretch flex items-start left-1/2 pb-[8px] pt-[9px] px-[18px] rounded-[999px] top-[77.12px]" data-node-id="939:1725" data-name="Chip">
        <p className="[word-break:break-word] font-['NanumSquareRound:Regular'] leading-[24px] not-italic relative shrink-0 text-[15px] text-center text-white tracking-[-0.15px] whitespace-nowrap" data-node-id="939:1726">
          Q-Story의 독서
        </p>
      </div>
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['NanumSquareRound:Bold'] leading-[1.75] left-[720.5px] not-italic text-[20px] text-[color:var(--ink\/600,#5e5577)] text-center top-[345.35px] tracking-[-0.2px] whitespace-nowrap" data-node-id="939:1728">
        Q-Story는 동화 속에서 생각하고 표현하는 경험을 만들어요.
      </p>
      <div className="absolute h-[184px] left-[383px] top-[136.74px] w-[658px]" data-node-id="939:1776">
        <div className="-translate-x-1/2 [word-break:break-word] absolute font-['NanumSquareRound:ExtraBold'] leading-[0] left-[329px] not-italic text-[60px] text-black text-center top-[10px] tracking-[-0.6px] whitespace-nowrap" data-node-id="939:1731">
          <p className="leading-[75px] mb-0 whitespace-pre">{`아이의 궁금증이 `}</p>
          <p className="leading-[75px] whitespace-pre">더 큰 생각으로 이어지도록</p>
        </div>
      </div>
    </div>
  );
}