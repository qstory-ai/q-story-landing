const assetPathPrefix = "https://www.figma.com/api/mcp/asset/1330994f-3bb4-49d4-ad79-e25e8ba203b6";
const imgEllipse12 = `${assetPathPrefix}/a2592.svg`;
const imgGroup = `${assetPathPrefix}/3f521.svg`;
const imgGroup1 = `${assetPathPrefix}/871f5.svg`;

export default function Frame57() {
  return (
    <div className="bg-[#7550d3] relative size-full" data-node-id="929:757">
      <div className="absolute content-stretch flex h-[285px] items-center justify-between left-[120px] right-[120px] top-[103.68px]" data-node-id="929:758" data-name="Row">
        <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0" data-node-id="929:759" data-name="Frame">
          <div className="[word-break:break-word] font-['NanumSquareRound:ExtraBold'] leading-[0] not-italic relative shrink-0 text-[0px] text-white tracking-[-0.45px] whitespace-nowrap" data-node-id="929:760">
            <p className="leading-[55px] mb-0 text-[45px]">우리 아이의 질문</p>
            <p className="text-[45px]">
              <span className="[word-break:break-word] font-['NanumSquareRound:ExtraBold'] leading-[55px] not-italic text-white tracking-[-0.45px]">Q-Story</span>
              <span className="leading-[55px]">에서 시작해볼까요?</span>
            </p>
          </div>
          <p className="[word-break:break-word] font-['NanumSquareRound:Bold'] leading-[1.75] not-italic relative shrink-0 text-[20px] text-white tracking-[-0.2px] whitespace-nowrap" data-node-id="929:761">
            아이의 질문이 대화가 되는 경험, Q-story에서 만나보세요.
          </p>
          <div className="h-[8px] relative shrink-0 w-[10px]" data-node-id="929:762" data-name="spacer" />
          <div className="bg-[var(--base\/white,white)] content-stretch drop-shadow-[0px_8px_10px_rgba(166,93,237,0.35)] flex h-[56px] items-center justify-center px-[30px] relative rounded-[999px] shrink-0 w-[200px]" data-node-id="929:763" data-name="Button/Soft Primary">
            <p className="[word-break:break-word] font-['NanumSquareRound:ExtraBold'] leading-[30px] not-italic relative shrink-0 text-[#a65ded] text-[20px] whitespace-nowrap" data-node-id="I929:763;9:413">
              무료로 체험하기 →
            </p>
          </div>
        </div>
      </div>
      <div className="absolute contents h-[533.115px] left-[832.01px] top-0 w-[514.917px]" data-node-id="929:764">
        <div className="absolute flex items-center justify-center left-[832.01px] size-[480.656px] top-[6.32px]" data-node-id="929:765">
          <div className="flex-none rotate-[-18.85deg]">
            <div className="relative size-[378.636px]">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse12} />
            </div>
          </div>
        </div>
        <div className="absolute contents inset-[11.33%_11.63%_7.89%_61.26%]" data-node-id="929:766" style={{ containerType: "size" }}>
          <div className="absolute flex inset-[11.33%_11.63%_7.89%_61.26%] items-center justify-center" data-node-id="929:767" style={{ containerType: "size" }}>
            <div className="flex-none h-[hypot(27.1805cqw,76.2078cqh)] rotate-[-18.85deg] w-[hypot(72.8195cqw,-23.7922cqh)]">
              <div className="relative size-full" data-name="Group">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup} />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute contents h-[482.219px] left-[882.09px] top-[38.26px] w-[464.842px]" data-node-id="929:773">
          <div className="absolute flex inset-[7.58%_6.46%_-3.07%_61.26%] items-center justify-center" data-node-id="929:774" style={{ containerType: "size" }}>
            <div className="flex-none h-[hypot(26.8937cqw,75.9432cqh)] rotate-[-18.85deg] w-[hypot(73.1063cqw,-24.0568cqh)]">
              <div className="relative size-full" data-name="Group">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGroup1} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}