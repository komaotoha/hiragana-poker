import { useState } from 'react';
import '../styles/HelpModal.css';

type HelpTab = 'rules' | 'howto' | 'ranks';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: HelpTab;
}

export function HelpModal({ isOpen, onClose, initialTab = 'rules' }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            ルール
          </button>
          <button
            className={`tab-btn ${activeTab === 'howto' ? 'active' : ''}`}
            onClick={() => setActiveTab('howto')}
          >
            遊び方
          </button>
          <button
            className={`tab-btn ${activeTab === 'ranks' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranks')}
          >
            役一覧
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'rules' && <RulesContent />}
          {activeTab === 'howto' && <HowToContent />}
          {activeTab === 'ranks' && <RanksContent />}
        </div>
      </div>
    </div>
  );
}

function RulesContent() {
  return (
    <div className="help-content">
      <h3>【ひらがな作文ポーカーとは】</h3>
      <p>配られた5枚のひらがなカードで言葉を作り、役の強さを競うゲームです。</p>

      <h3>【基本ルール】</h3>
      <ul>
        <li>使用カード：あ〜ん（46文字）＋伸ばし棒「ー」</li>
        <li>各プレイヤーに5枚配布</li>
        <li>1回だけカード交換可能</li>
        <li>作った言葉をみんなで判定</li>
      </ul>

      <h3>【勝利条件】</h3>
      <p>言葉が「日本語として成立している」と他のプレイヤーに認められれば得点！一番高い点数の人が勝ち！</p>
    </div>
  );
}

function HowToContent() {
  return (
    <div className="help-content">
      <h3>【ゲームの流れ】</h3>

      <div className="step">
        <span className="step-num">①</span>
        <div className="step-content">
          <strong>カード交換</strong>
          <p>いらないカードを選んで交換できます（交換しなくてもOK）</p>
        </div>
      </div>

      <div className="step">
        <span className="step-num">②</span>
        <div className="step-content">
          <strong>並び替え</strong>
          <p>カードをドラッグして好きな順番に並べます。「並び順を確定」で次へ</p>
        </div>
      </div>

      <div className="step">
        <span className="step-num">③</span>
        <div className="step-content">
          <strong>役を作る</strong>
          <p>連続するカードを選んで言葉を登録。複数の言葉を登録OK（保険になる）</p>
        </div>
      </div>

      <div className="step">
        <span className="step-num">④</span>
        <div className="step-content">
          <strong>判定タイム</strong>
          <p>順番に言葉を発表。みんなで投票して認められたら得点！</p>
        </div>
      </div>

      <div className="step">
        <span className="step-num">⑤</span>
        <div className="step-content">
          <strong>結果発表</strong>
          <p>一番高得点の人が優勝！</p>
        </div>
      </div>
    </div>
  );
}

function RanksContent() {
  const rankList = [
    { name: 'ファイブカード', score: 100, desc: '5文字の言葉' },
    { name: 'フォーカード', score: 80, desc: '4文字の言葉' },
    { name: 'フルハウス', score: 70, desc: '3文字＋2文字の言葉' },
    { name: 'スリーカード', score: 50, desc: '3文字の言葉' },
    { name: 'ツーペア', score: 40, desc: '2文字×2の言葉' },
    { name: 'ワンペア', score: 20, desc: '2文字の言葉' },
    { name: '役なし', score: 0, desc: '言葉が作れない' },
  ];

  return (
    <div className="help-content">
      <table className="rank-table">
        <thead>
          <tr>
            <th>順位</th>
            <th>役名</th>
            <th>説明</th>
            <th>点数</th>
          </tr>
        </thead>
        <tbody>
          {rankList.map((rank, i) => (
            <tr key={rank.name}>
              <td>{i + 1}</td>
              <td>{rank.name}</td>
              <td>{rank.desc}</td>
              <td>{rank.score}点</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ヘルプボタンコンポーネント
export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="help-btn" onClick={() => setIsOpen(true)}>
        ?
      </button>
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
