export interface HubPage {
  slug: string;
  path: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  h1: string;
  intro: string[];
  steps: { title: string; text: string }[];
  costTable?: {
    caption: string;
    note: string;
    rows: { plan: string; price: string; note: string }[];
  };
  tips: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
  blogSlug?: string;
}

const PLANS_CHANGE_NOTE =
  "Prices are typical US list prices for individual plans and change often — always check the provider's site before you commit.";

export const HUB_PAGES: HubPage[] = [
  {
    slug: "how-to-split-subscriptions",
    path: "/how-to-split-subscriptions",
    metaTitle: "How to Split Subscriptions with Friends (2026 Guide)",
    metaDescription:
      "Learn how to share Netflix, Spotify, ChatGPT and Disney+ costs fairly with roommates: picks of who pays, reminders, and the tool that does the math for you.",
    ogTitle: "How to Split Subscriptions",
    h1: "How to Split Subscriptions with Friends",
    intro: [
      "Streaming and AI subscriptions now cost more than a week of groceries for many households. Netflix, Spotify, ChatGPT Plus and Disney+ together easily pass $50–$80 a month — most of it spent alone.",
      "The fix is simple: share accounts with people you trust and split the bill fairly. This guide covers the three rules that keep shared subscriptions from ruining friendships, plus the free tool that automates the math.",
    ],
    steps: [
      {
        title: "Pick one owner per subscription",
        text: "One person pays the provider directly. Everyone else sends their share monthly. No joint accounts, no shared passwords to banking — just one bill owner and clear shares.",
      },
      {
        title: "Agree on fair shares upfront",
        text: "Equal shares work for equal use. If one person is the main user — say, you watch Netflix every night and a roommate once a week — a 60/40 split is fair. Agree before anyone pays.",
      },
      {
        title: "Automate reminders, never chase",
        text: "Adult conversations about $6 are the fastest way to kill a friendship. Let a tool track who paid, who owes, and send a polite reminder when someone forgets.",
      },
    ],
    costTable: {
      caption: "Typical US monthly plans you can share",
      note: PLANS_CHANGE_NOTE,
      rows: [
        { plan: "Netflix (Standard)", price: "$15.49", note: "2 screens — share with one friend" },
        { plan: "Netflix (Premium)", price: "$22.99", note: "4 screens — ideal for 4 people" },
        { plan: "Spotify Premium", price: "$11.99", note: "Family plan covers 6 users" },
        { plan: "ChatGPT Plus", price: "$20.00", note: "Share login with a partner on a work trip? Ask first" },
        { plan: "Disney+ Premium", price: "$13.99", note: "4 streams — split four ways" },
      ],
    },
    tips: [
      "Always share with people you trust — never strangers from the internet.",
      "Set a monthly 'settlement day' (the 1st) so nobody owes anyone for weeks.",
      "Revisit shares when someone starts using the account more.",
      "Keep one shared note with the login, the owner, and each member's share.",
    ],
    faqs: [
      {
        q: "Is sharing subscriptions with friends allowed by Netflix and Spotify?",
        a: "Account sharing technically violates most consumer terms of service, but many — like Spotify Family and Disney+ — have official family plans that explicitly permit shared use. A family/home plan with a fair split is the safest way to go.",
      },
      {
        q: "What's the fairest way to split a shared subscription?",
        a: "For equal users, split equally. When usage differs, agree on a draft before anyone pays — for example 60/40 for heavy vs light users. Writing it down prevents awkwardness the month the bill arrives.",
      },
      {
        q: "What happens when someone doesn't pay their share?",
        a: "Automated reminders solve 95% of missed payments — most people simply forget. SubSplit sends a polite ping on settlement day and tracks who's behind, so you never have to bring it up yourself.",
      },
      {
        q: "Can SubSplit track money between friends automatically?",
        a: "Yes. SubSplit records who paid, calculates each share, and tracks balances so the group always knows who owes whom — with payment handles (Venmo, Cash App, Zelle) ready to go.",
      },
    ],
    relatedSlugs: ["split-netflix", "split-spotify", "split-chatgpt", "split-disney-plus"],
    blogSlug: "best-apps-to-split-subscription-costs",
  },
  {
    slug: "split-netflix",
    path: "/split-netflix",
    metaTitle: "How to Split Netflix with Friends in 2026 — SubSplit",
    metaDescription:
      "A practical guide to sharing a Netflix account and splitting the bill: which plan fits, fair shares per screen, and reminders that end awkward money talks forever.",
    ogTitle: "Split Netflix Cost",
    h1: "How to Split Netflix Cost with Friends",
    intro: [
      "Netflix Premium costs $22.99 a month in the US for four screens. Used alone, that's $275 a year for movies you half-watch. Split across four people it's $6 a month each — roughly the price of a burrito.",
      "The catch: Netflix has been cracking down on password sharing outside the household. A clean way to stay fair is a small, trusted circle that treats the bill like a group dinner: one pays, everyone chips in, nobody feels cheated.",
    ],
    steps: [
      {
        title: "Choose the plan for your group size",
        text: "Two people: Standard ($15.49, 2 screens). Three to four: Premium ($22.99, 4 screens). More than four profiles still works on Premium — the cap is screens in use at once.",
      },
      {
        title: "Set shares before the first bill",
        text: "Equal screens, equal shares. If one friend only watches documentaries on Mondays, a smaller share is fine — just agree in advance.",
      },
      {
        title: "One owner + automatic tracking",
        text: "Designate the bill owner. SubSplit tracks who owes what every month and sends checkout-date reminders, so the owner never has to ask.",
      },
    ],
    costTable: {
      caption: "Netflix US plans at a glance",
      note: PLANS_CHANGE_NOTE,
      rows: [
        { plan: "Standard with ads", price: "$6.99", note: "2 screens — light users" },
        { plan: "Standard", price: "$15.49", note: "2 screens, no ads" },
        { plan: "Premium", price: "$22.99", note: "4 screens, 4K — best value for 4 people" },
      ],
    },
    tips: [
      "Stick to people you know in real life — Netflix's household rules make stranger-sharing against their terms.",
      "Rotate the owner every 6 months so one person doesn't front the whole year.",
      "Pay your share right after the bill autocharges — same day, on the 1st.",
      "One shared note: login, owner, each person's share, settlement day.",
    ],
    faqs: [
      {
        q: "Can 4 people really share one Netflix Premium account?",
        a: "Yes — Premium supports 4 simultaneous streams and up to 5 profiles. The main limitation is Netflix's household policy: keep membership within people who live together or are in your trusted circle, and be ready for extra member rules.",
      },
      {
        q: "What's the cheapest way to get Netflix as a group?",
        a: "Premium split four ways is the lowest cost per person ($5.75 each based on typical pricing) per screen. Two people are better off with Standard.",
      },
      {
        q: "Is it legal to split Netflix with friends?",
        a: "Consumer account-sharing terms are a gray area, and Netflix has enforced household limits. The safest route is Netflix's official extra-member plan; a trusted small group splitting the bill is common but technically against terms.",
      },
      {
        q: "How does SubSplit remind friends to pay for Netflix?",
        a: "You add your Netflix payment with its billing day, create a group of friends, and SubSplit sends automatic reminders when someone hasn't paid their share — with Venmo, Cash App and Zelle handles attached.",
      },
    ],
    relatedSlugs: ["how-to-split-subscriptions", "split-spotify", "split-disney-plus"],
    blogSlug: "how-to-split-netflix-cost",
  },
  {
    slug: "split-spotify",
    path: "/split-spotify",
    metaTitle: "How to Split Spotify Premium with Friends (Family Plan) — SubSplit",
    metaDescription:
      "The easiest way to share Spotify Premium: the official Family plan covers 6 people for $19.99. Learn how to split it fairly and track payments automatically.",
    ogTitle: "Split Spotify Premium",
    h1: "How to Split Spotify Premium with Friends",
    intro: [
      "Spotify's Family plan costs $19.99 a month for six accounts — that's $3.33 per person. Compare that to six individual plans at $11.99 each: a family group saves the whole crew nearly $900 a year.",
      "Spotify officially allows unrelated people on a Family plan as long as everyone lives at the same address — a rule many groups bend, but the structure is still the cheapest legal-ish way to share premium.",
    ],
    steps: [
      {
        title: "Start a Family plan, invite 5 friends",
        text: "One account holder pays $19.99/month and sends the 5 invites. Each invitee keeps their own playlists and algorithm — no shared logins, no messy switching.",
      },
      {
        title: "Split six ways and forget it",
        text: "6 × $3.33, or let the owner pay and everyone send their share on settlement day. Some groups buy 1–2 months ahead with prepaid gift cards.",
      },
      {
        title: "Track shares in SubSplit",
        text: "Create a 'Spotify Family' group with the six members and the $19.99 price. SubSplit shows who hasn't paid and pings them politely.",
      },
    ],
    costTable: {
      caption: "Spotify Premium US options",
      note: PLANS_CHANGE_NOTE,
      rows: [
        { plan: "Individual", price: "$11.99", note: "1 account — no sharing" },
        { plan: "Duo", price: "$19.99", note: "2 accounts + Duo Mix playlist" },
        { plan: "Family", price: "$19.99", note: "6 accounts — best per-person value" },
      ],
    },
    tips: [
      "The Family plan includes parental controls — handy even between friends.",
      "Keep the group stable: each invite has 'one address' rules, so don't churn members constantly.",
      "Use a monthly reminder so the same person doesn't pay out of pocket for six friends every month.",
    ],
    faqs: [
      {
        q: "How do I add friends to a Spotify Family plan?",
        a: "The owner opens Settings → Spotify Family, generates an invite link, and the friend joins with their own account. Spotify may ask members to confirm the same address.",
      },
      {
        q: "Is the Spotify Family plan cheaper than splitting individual plans?",
        a: "Yes. Six individual plans cost about $72/month; one Family plan is around $20. Split six ways, each person pays roughly $3.33 instead of $11.99.",
      },
      {
        q: "What happens if one friend leaves the group?",
        a: "The owner can remove them in settings, and the remaining members' cost per person drops or the next friend takes the slot. SubSplit recalculates shares instantly when members change.",
      },
    ],
    relatedSlugs: ["how-to-split-subscriptions", "split-netflix", "split-chatgpt"],
  },
  {
    slug: "split-chatgpt",
    path: "/split-chatgpt",
    metaTitle: "How to Split ChatGPT Plus Cost with Friends — SubSplit",
    metaDescription:
      "ChatGPT Plus is $20 a month per seat. Learn when sharing an account with a trusted friend makes sense, how to split it, and how to stay out of trouble with OpenAI's rules.",
    ogTitle: "Split ChatGPT Plus",
    h1: "How to Split ChatGPT Plus Cost with Friends",
    intro: [
      "ChatGPT Plus at $20/month adds up fast: $240 a year per person. If you mostly use it a few times a week, a shared account with a trusted friend is a tempting save — and a real gray area with OpenAI's terms.",
      "This guide covers the safe options (Teams/Workspace-style seats, official business plans), the personal-sharing workaround, and how to keep the money side automatic either way.",
    ],
    steps: [
      {
        title: "Know the rules first",
        text: "ChatGPT accounts are personal and non-transferable. Sharing one login violates the terms and risks account suspension. The official way to split cost is an OpenAI account used by two people who trust each other implicitly — or a business plan for teams.",
      },
      {
        title: "If you share: set ground rules",
        text: "Two people, one login: same session limits, no deleting each other's chats, no secrets in shared chats. One person pays, the other sends $10 on the 1st.",
      },
      {
        title: "Track the split automatically",
        text: "Add ChatGPT Plus ($20) to a SubSplit group with two members. SubSplit handles the reminder so the paying friend never has to text about $10.",
      },
    ],
    costTable: {
      caption: "OpenAI plans",
      note: PLANS_CHANGE_NOTE,
      rows: [
        { plan: "ChatGPT Free", price: "$0", note: "Limited messages — enough for light use" },
        { plan: "ChatGPT Plus", price: "$20.00", note: "Faster models, priority access" },
        { plan: "ChatGPT Pro/Team", price: "$200+/seat", note: "For professionals and teams" },
      ],
    },
    tips: [
      "Shared accounts break OpenAI's terms — never share with strangers.",
      "Use separate chat folders or a rule: 'work chats stay in work threads'.",
      "Split at $10 each for Plus; revisit if one person starts using it 10x more.",
    ],
    faqs: [
      {
        q: "Can two people share one ChatGPT Plus account?",
        a: "Technically the login only works for a single user, and sharing violates OpenAI's Terms of Service, risking suspension. If you do it with a trusted friend, keep chats organized and split the bill exactly in half.",
      },
      {
        q: "Is there an official way to split ChatGPT with friends?",
        a: "For teams, OpenAI offers Workspace-style plans with per-seat pricing. For friends, there's no official 'Duo' plan like Spotify — that's why a shared account (your own risk) or separate Plus subscriptions are the only options.",
      },
      {
        q: "How much can we save splitting ChatGPT?",
        a: "A shared Plus account split two ways saves ~$120/person/year vs two individual subscriptions, but breaks the terms. The compliant alternative — two individual Plus accounts — costs $40/month combined.",
      },
    ],
    relatedSlugs: ["how-to-split-subscriptions", "split-spotify"],
  },
  {
    slug: "split-disney-plus",
    path: "/split-disney-plus",
    metaTitle: "How to Split Disney+ Cost with Friends — SubSplit",
    metaDescription:
      "Disney+ Premium supports 4 simultaneous streams: split it four ways and each person pays a few dollars a month. Here's how, with automatic payment reminders.",
    ogTitle: "Split Disney+ Cost",
    h1: "How to Split Disney+ Cost with Friends",
    intro: [
      "Disney+ Premium lets four streams run at once and supports up to seven profiles — making it one of the most share-friendly subscriptions on the market. Split four ways, it lands at a few dollars a month per person.",
      "Unlike some services, Disney+ has been tolerant of sharing, and its family plans officially cover multiple profiles. Here's the cleanest way to share cost and screens without drama.",
    ],
    steps: [
      {
        title: "Pick Premium, invite up to 6 profiles",
        text: "One account, one owner, up to 7 profiles. Four simultaneous streams give headroom even with a busy household of friends.",
      },
      {
        title: "Split by stream or by profile",
        text: "Four equal users: divide the price by four. If someone only shows up for Marvel weekends, a lighter share is fair — agree in advance.",
      },
      {
        title: "Automate the monthly settle-up",
        text: "Track Disney+ in SubSplit with your group: billing day, price, members. The tool sends reminders and keeps balances, so the owner is never the free banker.",
      },
    ],
    costTable: {
      caption: "Disney+ US plans (may bundle Hulu / ESPN+)",
      note: PLANS_CHANGE_NOTE,
      rows: [
        { plan: "Disney+ Basic (Ads)", price: "$9.99", note: "1 stream — for single users" },
        { plan: "Disney+ Premium", price: "$13.99", note: "4 streams, 7 profiles — group value" },
        { plan: "Disney Bundle Trio", price: "$16.99+", note: "Disney+, Hulu, ESPN+ — great for splits" },
      ],
    },
    tips: [
      "Set each friend to their own profile so recommendations don't mix.",
      "The Bundle Trio is the best group deal if two of three services land in your group.",
      "Recheck shares after price increases — Disney raises prices periodically.",
    ],
    faqs: [
      {
        q: "How many people can share a Disney+ Premium account?",
        a: "Disney+ Premium allows up to 7 profiles and 4 simultaneous streams. That comfortably fits 2–4 share partners, each with their own watch history.",
      },
      {
        q: "Is the Disney bundle worth splitting?",
        a: "The Trio bundle (Disney+ + Hulu + ESPN+) costs more but splits well: three friends each a different service gets every service for roughly a third of the price.",
      },
      {
        q: "Does SubSplit work for irregular shares like Disney+?",
        a: "Yes — shares are percentages, so a 50/30/20 split is as easy as equal thirds. Change members mid-month and the balances stay correct.",
      },
    ],
    relatedSlugs: ["how-to-split-subscriptions", "split-netflix"],
  },
];

export function getHubPage(slug: string): HubPage | undefined {
  return HUB_PAGES.find((p) => p.slug === slug);
}