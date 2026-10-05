import { MainCta, NavCta } from "@/components/home/auth-cta";
import { PlanOverview } from "@/components/home/plan-overview";
import { SampleMeeting } from "@/components/home/sample-meeting";
import { Toaster } from "@/components/ui/sonner";
import { MAX_UPLOAD_MB } from "@/lib/meetings";
import { AudioLines } from "lucide-react";
import Link from "next/link";

// The words come from homepage-copy.md. Edit them there first, then here.

const STEPS = [
  {
    title: "Upload your recording.",
    text: `MP3, M4A or WAV, up to ${MAX_UPLOAD_MB} MB.`,
  },
  {
    title: "Get the transcript.",
    text: "Every word, so you can check what was actually said.",
  },
  {
    title: "Get the summary.",
    text: "A short recap, the decisions, and the action items with names and dates.",
  },
];

const QUESTIONS = [
  {
    question: "Are my recordings private?",
    answer:
      "Only you can see your recordings, transcripts and summaries. To make the transcript and summary, we send the audio and text to OpenAI. OpenAI says it doesn't use this kind of data to train its models.",
  },
  {
    question: "Which languages does it work with?",
    answer:
      "Most widely spoken languages, and the summary comes back in the language of the meeting. It works best with clear audio and works best of all in English. Try it on one of your free meetings to see how it handles yours.",
  },
  {
    question: "What happens when I cancel?",
    answer:
      "You keep Pro until the end of the month you've paid for. After that you won't be charged again, and your past meetings are still there.",
  },
  {
    question: "Can I delete my data?",
    answer:
      "Yes. You can delete any meeting, and that removes the recording, transcript and summary. To delete your whole account, email [support email] and we'll remove everything.",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default function Home() {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <AudioLines className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">Meeting Scribe</span>
          </Link>
          <NavCta />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-4 py-12 sm:gap-20 sm:px-6 sm:py-16">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn your call recording into notes and action items.
            </h1>
            <p className="max-w-xl text-pretty text-lg leading-8 text-muted-foreground">
              For freelancers and consultants who&apos;d rather listen to the
              client than type: upload the recording and get a clear summary
              of what was decided and who&apos;s doing what.
            </p>
          </div>
          <MainCta />
        </section>

        <Section title="How it works">
          <ol className="flex flex-col gap-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {index + 1}
                </span>
                <p className="max-w-xl pt-1 leading-6">
                  <span className="font-medium">{step.title}</span>{" "}
                  <span className="text-muted-foreground">{step.text}</span>
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="What you get">
          <p className="max-w-xl leading-7 text-muted-foreground">
            This is what a 40-minute client call looks like in Meeting Scribe.
            If nobody said who owns a task or when it&apos;s due, the summary
            says so. It doesn&apos;t guess.
          </p>
          <SampleMeeting />
        </Section>

        <Section title="Pricing">
          <PlanOverview />
        </Section>

        <Section title="Questions">
          <dl className="flex flex-col gap-6">
            {QUESTIONS.map(({ question, answer }) => (
              <div key={question} className="flex max-w-xl flex-col gap-1.5">
                <dt className="font-medium">{question}</dt>
                <dd className="leading-7 text-muted-foreground">{answer}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <section className="flex flex-col gap-6 border-t pt-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Try it on your next call.
          </h2>
          <MainCta />
        </section>
      </main>

      <Toaster position="bottom-right" />
    </>
  );
}
