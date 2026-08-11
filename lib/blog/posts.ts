export type BlogBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "cta"; text: string; link: string };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  sections: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-split-netflix-cost",
    title: "How to Split Netflix Cost in 2026 — Complete Guide",
    excerpt:
      "Netflix password sharing is dead. Here's how to split the cost fairly with roommates and friends — and automate it so you never chase anyone again.",
    date: "2026-08-05",
    readTime: "4 min read",
    sections: [
      {
        type: "p",
        text: "Netflix is expensive. The Premium plan costs $15.99 a month in the US, and if you're a student or just starting out, that's real money. The good news: you don't have to pay it alone. Splitting a Netflix account between roommates or close friends is legal, easy, and can cut your bill by 75%. This guide walks through exactly how to split Netflix cost in 2026, what changed with password sharing, and how to make sure nobody forgets to pay.",
      },
      { type: "h2", text: "Why Netflix Password Sharing Is Dead" },
      {
        type: "p",
        text: "For years, the playbook was simple: one friend's cousin had a login, and everyone used it. That era ended in 2023 when Netflix rolled out paid sharing and started blocking accounts used outside the owner's household. Today, extra members cost $7.99 per person per month, and accounts get locked if Netflix detects logins from too many different places. Password sharing across different homes effectively no longer works.",
      },
      {
        type: "p",
        text: "What does work is Netflix's official Household feature: you can add up to two extra members to your account, or simply share the account with people who live in the same house. The practical playbook in 2026 is a household group of roommates — people at the same address — splitting the Premium plan. The person who owns the account pays the bill, and everyone else pays them back monthly.",
      },
      { type: "h2", text: "The Math: $15.99 Split 4 Ways = $4.00 Each" },
      {
        type: "p",
        text: "Let's do the math. Netflix Premium (4K, four simultaneous streams) is $15.99 a month. Split four ways, that's exactly $4.00 per person. Even three ways, it's $5.33 — less than half of what a single Standard plan costs. Add 4K, no ads, and four screens to the deal, and you're getting a better product for a fraction of the price.",
      },
      {
        type: "p",
        text: "The math is the easy part. The hard part is the logistics: who pays the card, who pays whom back, when, and what happens if someone quits mid-cycle. That's where a subscription splitter comes in. Set the share percentages once, and every month the split is recalculated automatically — 25%, 25%, 25%, 25%, or 30/30/40 if someone uses it way more.",
      },
      { type: "h2", text: "How SubSplit Automates It" },
      {
        type: "p",
        text: "SubSplit was built for exactly this problem. You add your Netflix subscription with its price and billing date, create a group with your roommates or friends, and SubSplit tracks who owes what. When the billing date approaches, it sends friendly reminders to anyone who hasn't paid — no awkward group chat messages, no 'hey did you venmo me yet?' texts.",
      },
      {
        type: "p",
        text: "Everyone pays back however they already pay: Venmo, Cash App, Zelle, PayPal. SubSplit keeps the running ledger so nobody pays twice and nobody gets forgotten. If someone leaves the group, the shares recalculate instantly. And because the group owner keeps the Netflix account and password, your login stays with you.",
      },
      {
        type: "p",
        text: "The same setup works for Spotify Family, Disney+, YouTube Premium, ChatGPT Plus — anything you share with people you trust. Create your first group free, add one subscription, and see how much easier the monthly routine gets.",
      },
      { type: "cta", text: "Try SubSplit Free", link: "/login" },
    ],
  },
  {
    slug: "best-apps-to-split-subscription-costs",
    title: "5 Best Apps to Split Subscription Costs",
    excerpt:
      "From dedicated subscription splitters to general bill apps and good old Excel — we compared the five best ways to split subscription costs with friends.",
    date: "2026-07-28",
    readTime: "4 min read",
    sections: [
      {
        type: "p",
        text: "You share Netflix with your roommates, Spotify Family with your siblings, and a ChatGPT plan with your study group. Keeping track of who paid what is a mess. Subscription splitting apps exist exactly for this, and the options range from purpose-built tools to general-purpose bill splitters and one very stubborn spreadsheet. Here's an honest comparison of the five best apps to split subscription costs in 2026.",
      },
      { type: "h2", text: "1. SubSplit (subscription-focused)" },
      {
        type: "p",
        text: "SubSplit is built specifically for shared subscriptions. You add services like Netflix, Spotify, or ChatGPT, set the price and billing date, and create a group with your friends. It calculates each person's fair share — down to the penny — and sends automatic reminders before every billing date, so nobody forgets to pay. It keeps a running history of who paid when, and everyone settles up through Venmo, Cash App, or Zelle.",
      },
      {
        type: "p",
        text: "Where it wins: subscriptions recur every month, and SubSplit is designed around that monthly rhythm instead of treating every expense like a one-off dinner. Shares can be uneven (30/30/40), members can leave without breaking the math, and reminders escalate in friendliness until the bill is settled. There's a free plan, and [[Pro costs $3.99/month|/pricing]] if you manage a lot of groups.",
      },
      {
        type: "p",
        text: "Where it doesn't: it's not a general budgeting tool. If you need to split rent, groceries, and utilities too, you'll pair it with something else.",
      },
      { type: "h2", text: "2. Splitwise (general)" },
      {
        type: "p",
        text: "Splitwise is the most popular bill-splitting app overall, and it handles subscriptions fine: add the Netflix bill, split it evenly, done. Its strength is flexibility — rent, trips, dinners, utilities all live in one place, and the app rolls everything into a single 'who owes whom' balance.",
      },
      {
        type: "p",
        text: "Where it loses points for subscriptions: recurring bills are just line items, not tracked cycles. You add the Netflix expense again every month, nothing reminds you before the billing date, and 'subgroups' for different sets of friends take manual setup. Great generalist, but subscriptions aren't its specialty.",
      },
      { type: "h2", text: "3. Venmo Groups" },
      {
        type: "p",
        text: "Venmo's group feature lets you create a shared group where members can send money, see the balance, and settle up. For a small circle that already lives in Venmo, it's zero extra apps. One person pays the Netflix bill, posts the split request, and everyone taps pay.",
      },
      {
        type: "p",
        text: "The limits: no scheduling, no automatic reminders tied to billing dates, no share percentages beyond even splits, and no history beyond the transaction feed. It's a great payment rail but a weak manager. You'll remember to post the request every month — that's on you.",
      },
      { type: "h2", text: "4. Tricount" },
      {
        type: "p",
        text: "Tricount is a European favorite for splitting shared expenses, including group trips and shared housing costs. It's simple, free, and shows a clear 'who pays whom' settlement at the end. Adding a monthly Netflix line and splitting it evenly takes seconds.",
      },
      {
        type: "p",
        text: "Like Splitwise, it treats subscriptions as manual recurring entries — nothing automates the monthly bill, and uneven shares are awkward to express. Great for a weekend in Lisbon, less great for a Spotify Family plan you'll split for the next two years.",
      },
      { type: "h2", text: "5. Excel (lol)" },
      {
        type: "p",
        text: "Yes, a spreadsheet. For the one person who actually trusts a shared Google Sheet with their friends' money, a subscription tracker with columns for service, price, and who paid works — for about three months. Then someone doesn't update it, the formula breaks, and the sheet dies quietly alongside the friendship's financial trust.",
      },
      {
        type: "p",
        text: "Excel's only real advantage is that it's free and already on your computer. The cost is everything else: no reminders, no history, no multi-user editing that survives phone keyboards, no automatic math on uneven shares. If you're at the spreadsheet stage, you're exactly the person who'd benefit from an app that does the tracking for you.",
      },
      {
        type: "p",
        text: "The honest takeaway: if you split subscriptions monthly with the same people, a purpose-built tool like SubSplit saves the most time and the most awkward conversations. If you also split rent and dinners, Splitwise covers more ground. Either beats an unpaid Venmo request — and all of them beat Excel. [[Read more tips on the blog|/blog]] or [[check the plans|/pricing]] to see what fits.",
      },
    ],
  },
  {
    slug: "how-much-americans-waste-on-unused-subscriptions",
    title: "How Much Americans Waste on Unused Subscriptions",
    excerpt:
      "The average American spends over $1,300 a year on subscriptions — and forgets about many of them. Here's how to audit your subscriptions and stop paying for what you don't use.",
    date: "2026-07-14",
    readTime: "4 min read",
    sections: [
      {
        type: "p",
        text: "Every month, money quietly leaves your bank account for services you barely remember signing up for. A free trial that converted itself into a paid plan. A streaming app you opened once. A cloud storage tier you don't need. This isn't a you problem — it's a structural one: subscriptions are designed to be forgotten. The data on how much Americans waste on unused subscriptions is genuinely wild, and the fix is simpler than you'd think.",
      },
      { type: "h2", text: "The $1,332/Year Problem" },
      {
        type: "p",
        text: "Estimates from consumer research firms consistently land around $1,300 to $1,400 per year for the average American's subscription spending — and a significant share of that is forgotten or unused. Across streaming, music, apps, memberships, and software, the typical household juggles a dozen-plus recurring charges. Individually each one looks small; collectively they're a full car payment.",
      },
      {
        type: "p",
        text: "The psychology is the sneaky part. A $9.99 charge barely registers, especially when it's auto-renewed from a card on file. Companies make cancellation inconvenient on purpose: buried settings, 'are you sure?' flows, email offers that postpone the cancel by a month. By the time you notice a charge, you've already paid for several months you didn't use.",
      },
      { type: "h2", text: "Gen Z Loses $324/Year" },
      {
        type: "p",
        text: "Gen Z is the most subscription-heavy generation, and the numbers for wasted spend are rough: surveys consistently put the average lost amount for younger users around $300 per year on services they don't actually use. The cause isn't carelessness — it's stacking. Gen Z subscribes to more individual services than any previous generation: TikTok-like premium tiers, niche apps, and music plans layered on top of streaming bundles.",
      },
      {
        type: "p",
        text: "There's also a social angle: subscription sharing is how young people stretch their budgets, but most sharing happens informally — and informal sharing is where the money leaks. Someone pays the Spotify Family bill, another friend 'says' they'll chip in, and the request is never sent. The subscription costs the same, but the split never actually happens.",
      },
      { type: "h2", text: "How to Audit Your Subscriptions" },
      {
        type: "p",
        text: "Run a proper subscription audit once a quarter. Start with your bank and credit card statements — filter the last three months for anything recurring. List every service, its price, and the last time you genuinely used it. Anything unused for 30+ days is a candidate for cancellation. Anything you share with friends or family but don't actually split is a candidate for a subscription splitter.",
      },
      {
        type: "p",
        text: "Then go one layer deeper: free trials that converted. Search your email for 'your trial has ended' and 'your subscription is active'. These are the charges people forget most. Cancel the ones you don't use immediately — most services let you cancel online, and the ones that don't are probably not worth keeping anyway.",
      },
      { type: "h2", text: "Split What You Use, Cancel What You Don't" },
      {
        type: "p",
        text: "The endgame isn't canceling everything — it's making the things you keep cost less. The subscriptions you genuinely use (Netflix with roommates, Spotify Family, a shared ChatGPT Plus) should be split fairly, automatically. That's the entire point of SubSplit: you add the subscription, create a group, and it tracks who owes what and reminds everyone before the billing date. The money stops leaking, and nobody has to send awkward 'hey, you owe me' messages.",
      },
      {
        type: "p",
        text: "A one-time audit catches the waste; a subscription manager keeps it gone. Set aside 20 minutes this week to pull your statements, cancel what you don't use, and split what you keep. Your bank account will notice. [[Start your first group free|/login]], [[see how the math works|/faq]], or [[compare plans|/pricing]] to get going.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
