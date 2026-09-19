import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Heart,
  Home,
  Info,
  LayoutGrid,
  ListFilter,
  Menu,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { OpportunityCard } from "./components/OpportunityCard";
import { TeammateMatcher } from "./components/TeammateMatcher";
import { opportunities } from "./data/opportunities";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { recommendFromText, scoreWithPreferences } from "./lib/recommend";
import type {
  Opportunity,
  OpportunityType,
  PlanEntry,
  PlanStatus,
  UserPreferences,
} from "./types";

type View = "home" | "discover" | "teammates" | "plans" | "advisor";
type Plans = Record<string, PlanEntry>;
type ChatMessage = {
  role: "assistant" | "user";
  text: string;
  opportunityIds?: string[];
};
type AdvisorMode = "online" | "fallback";
type ChatPurpose = "opportunity" | "teammate";
const AI_API_URL = "https://supernz.xyz/zcst/api";
const categories: Array<"全部" | OpportunityType> = [
  "全部",
  "比赛",
  "讲座",
  "学习",
  "招募",
  "科研",
  "志愿",
  "活动",
];
const initialPreferences: UserPreferences = {
  interests: ["比赛", "学习"],
  beginner: true,
  preferShortTerm: false,
  canTeam: true,
  weeklyHours: 4,
};
const initialChat: ChatMessage[] = [
  {
    role: "assistant",
    text: "你好，我是拾机 AI 顾问。告诉我你的兴趣、基础、空闲时间和是否愿意组队，我会只依据题目提供的信息帮你挑选机会。",
  },
];

function App() {
  const [view, setView] = useState<View>("home"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState<(typeof categories)[number]>("全部");
  const [sort, setSort] = useState<"recommended" | "deadline">("recommended"),
    [selected, setSelected] = useState<Opportunity | null>(null),
    [mobileMenu, setMobileMenu] = useState(false);
  const [plans, setPlans] = useLocalStorage<Plans>("campuspick-plans-v1", {}),
    [preferences, setPreferences] = useLocalStorage<UserPreferences>(
      "campuspick-preferences-v1",
      initialPreferences,
    );
  const [published, setPublished] = useLocalStorage<Opportunity[]>("campuspick-published-v1", []);
  const allOpportunities = useMemo(() => [...opportunities, ...published], [published]);
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>("campuspick-chat-v1", initialChat),
    [chatInput, setChatInput] = useState(""),
    [isThinking, setIsThinking] = useState(false);
  const [advisorMode, setAdvisorMode] = useState<AdvisorMode>("online");
  const [chatPurpose, setChatPurpose] = useState<ChatPurpose>("opportunity");
  const [chatSavedAt, setChatSavedAt] = useLocalStorage<string>("campuspick-chat-saved-at-v1", "");
  const chatEnd = useRef<HTMLDivElement>(null);
  const filtered = useMemo(
    () =>
      allOpportunities
        .filter(
          (item) =>
            (category === "全部" || item.type === category) &&
            (!query.trim() ||
              `${item.title} ${item.original} ${item.tags.join(" ")}`
                .toLowerCase()
                .includes(query.trim().toLowerCase())),
        )
        .sort((a, b) =>
          sort === "recommended"
            ? scoreWithPreferences(b, preferences) -
              scoreWithPreferences(a, preferences)
            : (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"),
        ),
    [allOpportunities, category, preferences, query, sort],
  );
  const plannedItems = allOpportunities.filter((item) => plans[item.id]);
  const topRecommendations = [...allOpportunities]
    .sort(
      (a, b) =>
        scoreWithPreferences(b, preferences) -
        scoreWithPreferences(a, preferences),
    )
    .slice(0, 3);
  function navigate(next: View) {
    setView(next);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleSave(item: Opportunity) {
    setPlans((current) => {
      const next = { ...current };
      if (next[item.id]) delete next[item.id];
      else
        next[item.id] = {
          status: "saved",
          note: "",
          updatedAt: new Date().toISOString(),
        };
      return next;
    });
  }
  function updatePlan(id: string, patch: Partial<PlanEntry>) {
    setPlans((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? { status: "saved", note: "" }),
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }));
  }
  async function submitChat(text = chatInput) {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;
    const userMessage: ChatMessage = { role: "user", text: trimmed };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setChatInput("");
    setIsThinking(true);
    let receivedAny = false;
    try {
      const controller = new AbortController(),
        timeout = window.setTimeout(() => controller.abort(), 50000);
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          mode: chatPurpose,
          messages: conversation.map((message) => ({
            role: message.role,
            content: message.text,
          })),
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = (await response.json()) as { answer?: string };
        if (!data.answer) throw new Error("EMPTY_RESPONSE");
        setAdvisorMode("online");
        setMessages((current) => [...current, { role: "assistant", text: data.answer! }]);
        return;
      }
      if (!response.body) throw new Error("EMPTY_STREAM");
      setAdvisorMode("online");
      setMessages((current) => [...current, { role: "assistant", text: "" }]);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const line = event.split("\n").find((item) => item.startsWith("data:"));
          if (!line) continue;
          const data = JSON.parse(line.slice(5).trim()) as { text?: string; error?: string };
          if (data.error) throw new Error(data.error);
          if (!data.text) continue;
          receivedAny = true;
          setIsThinking(false);
          answer += data.text;
          setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, text: answer } : message));
          chatEnd.current?.scrollIntoView({ behavior: "auto" });
        }
      }
      if (!answer) throw new Error("EMPTY_RESPONSE");
      const opportunityIds = allOpportunities
        .filter(
          (item) =>
            answer.includes(item.title) ||
            new RegExp(
              `(?:编号|NO\\.?|^|[（(])\\s*${item.id}(?:[）)]|\\s|、|，|。)`,
              "m",
            ).test(answer),
        )
        .map((item) => item.id)
        .slice(0, 5);
      setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, opportunityIds } : message));
    } catch {
      if (receivedAny) {
        setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, text: `${message.text}\n\n（连接中断，已保留收到的内容）` } : message));
        return;
      }
      const results = recommendFromText(trimmed, allOpportunities);
      const fallback = topRecommendations.map((item) => ({
          item,
          reasons: ["与你当前保存的偏好较匹配"],
        })),
        picks = results.length ? results : fallback;
      const names = picks
        .map(
          ({ item, reasons }, index) =>
            `${index + 1}. ${item.title}：${reasons.slice(0, 2).join("，")}`,
        )
        .join("\n");
      setAdvisorMode("fallback");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: `在线 AI 暂时未响应，已为你切换到本地推荐：\n${names}\n\n你仍可继续浏览和规划，网络恢复后下一次对话会自动重试。`,
          opportunityIds: picks.map((result) => result.item.id),
        },
      ]);
    } finally {
      setIsThinking(false);
      window.setTimeout(
        () => chatEnd.current?.scrollIntoView({ behavior: "smooth" }),
        30,
      );
    }
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-mark">
            <Sparkles size={17} />
          </span>
          <span>
            拾机 <em>CampusPick</em>
          </span>
        </button>
        <nav>
          {[
            ["home", "首页"],
            ["discover", "发现机会"],
            ["teammates", "队友匹配"],
            ["plans", "我的计划"],
            ["advisor", "AI 顾问"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => navigate(id as View)}
            >
              {label}
              {id === "plans" && (
                <span className="nav-count">{plannedItems.length}</span>
              )}
            </button>
          ))}
        </nav>
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenu((v) => !v)}
        >
          <Menu />
        </button>
        {mobileMenu && (
          <div className="mobile-menu">
            {[
              ["home", "首页"],
              ["discover", "发现机会"],
              ["teammates", "队友匹配"],
              ["plans", "我的计划"],
              ["advisor", "AI 顾问"],
            ].map(([id, label]) => (
              <button key={id} onClick={() => navigate(id as View)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </header>
      <main>
        {view === "home" && (
          <HomeView
            onNavigate={navigate}
            plansCount={plannedItems.length}
            recommendations={topRecommendations}
            onOpen={setSelected}
            onSave={toggleSave}
            plans={plans}
          />
        )}
        {view === "discover" && (
          <DiscoverView
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
            items={filtered}
            plans={plans}
            onOpen={setSelected}
            onSave={toggleSave}
            onPublish={(item) => setPublished((current) => [...current, item])}
          />
        )}
        {view === "teammates" && <TeammateMatcher />}
        {view === "plans" && (
          <PlansView
            items={plannedItems}
            plans={plans}
            onOpen={setSelected}
            onUpdate={updatePlan}
            onRemove={toggleSave}
            onDiscover={() => navigate("discover")}
          />
        )}
        {view === "advisor" && (
          <AdvisorView
            messages={messages}
            input={chatInput}
            setInput={setChatInput}
            submit={submitChat}
            thinking={isThinking}
            mode={advisorMode}
            purpose={chatPurpose}
            setPurpose={(purpose) => {
              setChatPurpose(purpose);
              setMessages([{ role: "assistant", text: purpose === "teammate" ? "队友匹配模式已开启。告诉我你想参加的方向、擅长什么、希望队友补充什么，以及每周可投入多少时间。" : initialChat[0].text }]);
            }}
            savedAt={chatSavedAt}
            saveChat={() => setChatSavedAt(new Date().toISOString())}
            resetChat={() => { setMessages(initialChat); setChatSavedAt(""); }}
            preferences={preferences}
            setPreferences={setPreferences}
            onOpen={setSelected}
            chatEnd={chatEnd}
          />
        )}
      </main>
      <footer>
        <span>拾机 CampusPick</span>
        <span>题目模拟信息与学生自主发布内容</span>
      </footer>
      <BottomNav
        view={view}
        navigate={navigate}
        plansCount={plannedItems.length}
      />
      {selected && (
        <DetailModal
          item={selected}
          plan={plans[selected.id]}
          onClose={() => setSelected(null)}
          onSave={() => toggleSave(selected)}
          onUpdate={(patch) => updatePlan(selected.id, patch)}
        />
      )}
    </div>
  );
}

function HomeView({
  onNavigate,
  plansCount,
  recommendations,
  onOpen,
  onSave,
  plans,
}: {
  onNavigate: (v: View) => void;
  plansCount: number;
  recommendations: Opportunity[];
  onOpen: (i: Opportunity) => void;
  onSave: (i: Opportunity) => void;
  plans: Plans;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> CAMPUS OPPORTUNITY GUIDE
          </div>
          <h1>
            别让好机会，
            <br />
            <strong>淹没在消息里。</strong>
          </h1>
          <p>
            为大学新生整理校园比赛、讲座与实践机会。更快找到适合你的选择，再把心动变成行动。
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              onClick={() => onNavigate("discover")}
            >
              开始探索 <ArrowRight size={18} />
            </button>
            <button
              className="button ghost"
              onClick={() => onNavigate("advisor")}
            >
              <Bot size={18} /> 问问 AI 顾问
            </button>
          </div>
        </div>
        <div className="hero-orbit">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="radar-center">
            <Compass size={32} />
          </div>
          <div className="floating-note note-one">
            <span>AI 挑选</span>
            <b>适合你的机会</b>
          </div>
          <div className="floating-note note-two">
            <span>今日概览</span>
            <b>{opportunities.length} 条信息待发现</b>
          </div>
        </div>
      </section>
      <section className="stats-strip">
        <div>
          <b>{opportunities.length}</b>
          <span>条题目模拟信息</span>
        </div>
        <div>
          <b>{categories.length - 1}</b>
          <span>类校园场景</span>
        </div>
        <div>
          <b>{plansCount}</b>
          <span>项个人计划</span>
        </div>
        <div>
          <b>0</b>
          <span>条虚构信息</span>
        </div>
      </section>
      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="kicker">FOR YOU</span>
            <h2>可能适合你</h2>
            <p>根据新生偏好生成，设置偏好后会自动更新。</p>
          </div>
          <button
            className="text-button"
            onClick={() => onNavigate("discover")}
          >
            浏览全部 <ArrowRight size={16} />
          </button>
        </div>
        <div className="card-grid">
          {recommendations.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              plan={plans[item.id]}
              onOpen={onOpen}
              onSave={onSave}
            />
          ))}
        </div>
      </section>
      <section className="ai-banner">
        <div className="ai-icon">
          <MessageCircle />
        </div>
        <div>
          <span className="kicker">AI ADVISOR</span>
          <h2>不知道选什么？先聊聊。</h2>
          <p>说说你的方向、基础和时间，获得有理由、有边界的个性化建议。</p>
        </div>
        <button className="button light" onClick={() => onNavigate("advisor")}>
          开始对话 <ArrowRight size={18} />
        </button>
      </section>
    </>
  );
}

function DiscoverView({
  query,
  setQuery,
  category,
  setCategory,
  sort,
  setSort,
  items,
  plans,
  onOpen,
  onSave,
  onPublish,
}: {
  query: string;
  setQuery: (v: string) => void;
  category: (typeof categories)[number];
  setCategory: (v: (typeof categories)[number]) => void;
  sort: "recommended" | "deadline";
  setSort: (v: "recommended" | "deadline") => void;
  items: Opportunity[];
  plans: Plans;
  onOpen: (i: Opportunity) => void;
  onSave: (i: Opportunity) => void;
  onPublish: (i: Opportunity) => void;
}) {
  const [publishing, setPublishing] = useState(false);
  return (
    <section className="page-view">
      <div className="page-intro publish-intro">
        <div><span className="kicker">EXPLORE</span><h1>发现校园机会</h1><p>从比赛到实践，用你的条件筛出更合适的选择。</p></div>
        <button className="button join-pool-button" onClick={() => setPublishing(true)}><Plus size={18}/> 发布活动或招募</button>
      </div>
      <div className="discover-toolbar">
        <label className="search-box">
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索方向、技能或机会名称"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
        <div className="sort-control">
          <ListFilter size={16} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="recommended">优先推荐</option>
            <option value="deadline">截止时间</option>
          </select>
        </div>
      </div>
      <div className="category-tabs">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="result-line">
        <span>
          找到 <b>{items.length}</b> 个机会
        </span>
        <span>题目更新时间 · 2026.09.19</span>
      </div>
      {items.length ? (
        <div className="card-grid discover-grid">
          {items.map((item) => (
            <OpportunityCard
              key={item.id}
              item={item}
              plan={plans[item.id]}
              onOpen={onOpen}
              onSave={onSave}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search />
          <h3>没有匹配的机会</h3>
          <p>试试减少关键词或切换其他类别。</p>
          <button
            className="button primary"
            onClick={() => {
              setQuery("");
              setCategory("全部");
            }}
          >
            重置筛选
          </button>
        </div>
      )}
      {publishing && <PublishModal onClose={() => setPublishing(false)} onPublish={(item) => { onPublish(item); setPublishing(false); }} />}
    </section>
  );
}

function PublishModal({ onClose, onPublish }: { onClose: () => void; onPublish: (item: Opportunity) => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [type, setType] = useState<OpportunityType>("活动");
  const [eventDate, setEventDate] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim(), cleanDetail = detail.trim();
    if (!cleanTitle || !cleanDetail) return;
    onPublish({ id: `U${Date.now()}`, title: cleanTitle.slice(0, 40), original: cleanDetail.slice(0, 240), type, source: "学生个人", status: "学生新发布", tags: ["学生发起", "待自行核验"], eventDate: eventDate || undefined, audience: ["未说明"], format: "未说明", team: type === "招募" ? "组队" : "未说明" });
  }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <form className="publish-modal" onSubmit={submit}>
      <button type="button" className="modal-close" onClick={onClose}><X/></button>
      <span className="kicker">SHARE WITH CAMPUS</span><h2>发布活动或招募</h2><p className="form-hint">发布后会进入发现列表并保存在当前浏览器。请只填写可公开的信息。</p>
      <div className="publish-form">
        <label>标题<input required maxLength={40} value={title} onChange={event => setTitle(event.target.value)} placeholder="例如：周末代码交流搭子"/></label>
        <label>类型<select value={type} onChange={event => setType(event.target.value as OpportunityType)}>{categories.slice(1).map(item => <option key={item}>{item}</option>)}</select></label>
        <label>活动时间<input type="datetime-local" value={eventDate} onChange={event => setEventDate(event.target.value)}/></label>
        <label className="wide">详细说明<textarea required maxLength={240} value={detail} onChange={event => setDetail(event.target.value)} placeholder="说明时间、地点、人数、费用、参与条件和仍待确认的信息。"/></label>
      </div>
      <button className="button primary publish-submit">发布到发现列表</button>
    </form>
  </div>
}

function PlansView({
  items,
  plans,
  onOpen,
  onUpdate,
  onRemove,
  onDiscover,
}: {
  items: Opportunity[];
  plans: Plans;
  onOpen: (i: Opportunity) => void;
  onUpdate: (id: string, patch: Partial<PlanEntry>) => void;
  onRemove: (i: Opportunity) => void;
  onDiscover: () => void;
}) {
  const statusLabels: Record<PlanStatus, string> = {
    saved: "想了解",
    planning: "准备参加",
    done: "已完成",
    passed: "已放弃",
  };
  return (
    <section className="page-view">
      <div className="page-intro plans-intro">
        <span className="kicker">MY PATH</span>
        <h1>我的行动计划</h1>
        <p>把收藏变成下一步，记录你与每个机会的进展。</p>
      </div>
      {items.length ? (
        <div className="plan-layout">
          <div className="plan-summary">
            <div>
              <Target />
              <b>
                {items.filter((i) => plans[i.id].status === "planning").length}
              </b>
              <span>准备参加</span>
            </div>
            <div>
              <Heart />
              <b>
                {items.filter((i) => plans[i.id].status === "saved").length}
              </b>
              <span>想了解</span>
            </div>
            <div>
              <Check />
              <b>{items.filter((i) => plans[i.id].status === "done").length}</b>
              <span>已完成</span>
            </div>
          </div>
          <div className="plan-list">
            {items.map((item) => (
              <article className="plan-row" key={item.id}>
                <button className="plan-main" onClick={() => onOpen(item)}>
                  <span className={`type-dot dot-${item.type}`} />
                  <div>
                    <span className="mini-label">
                      {item.type} · NO.{item.id}
                    </span>
                    <h3>{item.title}</h3>
                    <p>
                      {plans[item.id].note ||
                        "还没有备注，可以记录你的下一步。"}
                    </p>
                  </div>
                  <ChevronRight />
                </button>
                <div className="plan-actions">
                  <select
                    value={plans[item.id].status}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        status: e.target.value as PlanStatus,
                      })
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => onRemove(item)}>
                    <X size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state large">
          <CalendarDays />
          <h3>计划清单还是空的</h3>
          <p>浏览机会并点击收藏，它们会出现在这里，而且刷新后仍会保留。</p>
          <button className="button primary" onClick={onDiscover}>
            去发现机会 <ArrowRight size={17} />
          </button>
        </div>
      )}
    </section>
  );
}

function AdvisorView({
  messages,
  input,
  setInput,
  submit,
  thinking,
  mode,
  purpose,
  setPurpose,
  savedAt,
  saveChat,
  resetChat,
  preferences,
  setPreferences,
  onOpen,
  chatEnd,
}: {
  messages: ChatMessage[];
  input: string;
  setInput: (v: string) => void;
  submit: (v?: string) => void;
  thinking: boolean;
  mode: AdvisorMode;
  purpose: ChatPurpose;
  setPurpose: (purpose: ChatPurpose) => void;
  savedAt: string;
  saveChat: () => void;
  resetChat: () => void;
  preferences: UserPreferences;
  setPreferences: (v: UserPreferences) => void;
  onOpen: (i: Opportunity) => void;
  chatEnd: React.RefObject<HTMLDivElement | null>;
}) {
  const prompts = purpose === "teammate" ? ["我会开发，想找会设计的队友", "我每周能投入4小时，想做AI项目", "帮我找合作节奏相近的队友"] : ["我是零基础，想参加 AI 比赛", "时间不多，想先参加一次活动", "我想学 Web 开发并认识同学"];
  return (
    <section className="advisor-page">
      <div className="advisor-head">
        <div>
          <span className="kicker">AI ADVISOR</span>
          <h1>和拾机聊聊你的方向</h1>
        </div>
        <span className={`mode-pill ${mode === "fallback" ? "fallback" : ""}`}>
          <span /> {mode === "online" ? "DeepSeek 在线" : "本地备用模式"}
        </span>
      </div>
      <div className="advisor-mode-switch"><button className={purpose === "opportunity" ? "active" : ""} onClick={() => setPurpose("opportunity")}><Sparkles size={15}/> 机会推荐</button><button className={purpose === "teammate" ? "active" : ""} onClick={() => setPurpose("teammate")}><Users size={15}/> 匹配队友</button><span>{savedAt ? `已保存 · ${new Date(savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : "当前对话未手动保存"}</span></div>
      <div className="advisor-layout">
        <aside className="preference-panel">
          <div className="panel-title">
            <Sparkles size={18} />
            <div>
              <b>你的偏好</b>
              <span>推荐排序会随之变化</span>
            </div>
          </div>
          <label>感兴趣的类型</label>
          <div className="preference-chips">
            {categories.slice(1).map((item) => (
              <button
                key={item}
                className={
                  preferences.interests.includes(item as OpportunityType)
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPreferences({
                    ...preferences,
                    interests: preferences.interests.includes(
                      item as OpportunityType,
                    )
                      ? preferences.interests.filter((x) => x !== item)
                      : [...preferences.interests, item as OpportunityType],
                  })
                }
              >
                {item}
              </button>
            ))}
          </div>
          <label className="toggle-row">
            <span>我是零基础 / 大一新生</span>
            <input
              type="checkbox"
              checked={preferences.beginner}
              onChange={(e) =>
                setPreferences({ ...preferences, beginner: e.target.checked })
              }
            />
          </label>
          <label className="toggle-row">
            <span>愿意参与团队项目</span>
            <input
              type="checkbox"
              checked={preferences.canTeam}
              onChange={(e) =>
                setPreferences({ ...preferences, canTeam: e.target.checked })
              }
            />
          </label>
          <label className="toggle-row">
            <span>更喜欢短期活动</span>
            <input
              type="checkbox"
              checked={preferences.preferShortTerm}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  preferShortTerm: e.target.checked,
                })
              }
            />
          </label>
          <div className="privacy-note">
            <Info size={15} />
            <span>对话会发送至你的 AI 服务。模型密钥只保存在服务器，不会进入浏览器或公开仓库。</span>
          </div>
        </aside>
        <div className="chat-panel">
          <div className="chat-top">
            <div className="bot-avatar">
              <Bot />
            </div>
            <div>
              <b>拾机 AI 顾问</b>
              <span>
                <i /> {mode === "online" ? "DeepSeek 已连接" : "本地推荐可用"}
              </span>
            </div>
            <button onClick={saveChat} title="保存对话"><Save size={16}/></button>
            <button onClick={resetChat} title="新建对话">
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={index}>
                <div className="message-bubble">
                  {message.text.split("\n").map((line, i) => (
                    <span key={i}>{line || <br />}</span>
                  ))}
                  {message.opportunityIds && (
                    <div className="recommend-links">
                      {message.opportunityIds.map((id) => {
                        const item = opportunities.find((x) => x.id === id)!;
                        return (
                          <button key={id} onClick={() => onOpen(item)}>
                            <span>{item.type}</span>
                            {item.title}
                            <ExternalLink size={13} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="message assistant">
                <div className="thinking">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <div className="quick-prompts">
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => submit(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：我零基础，每周能投入 4 小时……"
            />
            <button disabled={!input.trim() || thinking}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function DetailModal({
  item,
  plan,
  onClose,
  onSave,
  onUpdate,
}: {
  item: Opportunity;
  plan?: PlanEntry;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<PlanEntry>) => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <article className="detail-modal">
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="detail-header">
          <span className={`type-badge type-${item.type}`}>{item.type}</span>
          <span>机会编号 NO.{item.id}</span>
          <h2>{item.title}</h2>
          <div className="detail-meta"><span>{item.source}</span><span className={item.risk ? "risk-status" : ""}>{item.status}</span></div>
          <div className="tags">
            {item.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
        <div className="detail-body">
          <section>
            <h3>原始信息</h3>
            <p className="original-copy">{item.original}</p>
          </section>
          <div className="facts-grid">
            <div>
              <span>适合人群</span>
              <b>{item.audience.join("、")}</b>
            </div>
            <div>
              <span>参与形式</span>
              <b>{item.format ?? "题目未说明"}</b>
            </div>
            <div>
              <span>参与方式</span>
              <b>{item.team ?? "题目未说明"}</b>
            </div>
            <div>
              <span>投入情况</span>
              <b>{item.commitment ?? item.recurring ?? "题目未说明"}</b>
            </div>
          </div>
          {item.riskNote && (
            <div className="risk-notice">
              <Info />
              <p><b>请谨慎核验</b><span>{item.riskNote}</span></p>
            </div>
          )}
          {item.relatedTo && (
            <div className="similar-notice">
              <Info />
              <p>
                <b>关联通知 · NO.{item.relatedTo}</b>
                <span>{item.relationNote}</span>
              </p>
            </div>
          )}
          <section>
            <h3>我的备注</h3>
            <textarea
              value={plan?.note ?? ""}
              onChange={(e) => onUpdate({ note: e.target.value })}
              placeholder="例如：周五前找好队友，再决定是否参加……"
            />
          </section>
          <p className="data-boundary">
            <Info size={14} />{" "}
            {item.id.startsWith("U") ? "这是学生自主发布的公开内容，请在参与前核验时间、地点与发布者信息。" : "题目未提供的信息，拾机不会擅自补充。"}
          </p>
        </div>
        <div className="detail-footer">
          <button
            className={`button ${plan ? "ghost saved-action" : "primary"}`}
            onClick={onSave}
          >
            {plan ? (
              <>
                <Check /> 已收藏
              </>
            ) : (
              <>
                <Heart /> 加入我的计划
              </>
            )}
          </button>
          {plan && (
            <button
              className="button primary"
              onClick={() => {
                onUpdate({ status: "planning" });
                onClose();
              }}
            >
              设为准备参加
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

function BottomNav({
  view,
  navigate,
  plansCount,
}: {
  view: View;
  navigate: (v: View) => void;
  plansCount: number;
}) {
  const items: [View, string, React.ReactNode][] = [
    ["home", "首页", <Home />],
    ["discover", "发现", <LayoutGrid />],
    ["teammates", "队友", <Users />],
    ["plans", "计划", <CalendarDays />],
    ["advisor", "顾问", <Bot />],
  ];
  return (
    <div className="bottom-nav">
      {items.map(([id, label, icon]) => (
        <button
          className={view === id ? "active" : ""}
          key={id}
          onClick={() => navigate(id)}
        >
          {icon}
          <span>{label}</span>
          {id === "plans" && plansCount > 0 && <i>{plansCount}</i>}
        </button>
      ))}
    </div>
  );
}

export default App;
