import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Bell,
  Smartphone,
  Laptop,
  Settings,
  Wifi,
  Share,
  BellRing,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Install NailFeed App",
  description:
    "Learn how to install the NailFeed progressive web app on iOS, Android, and desktop, and turn on notifications so you never miss new activity.",
};

export default function AppSetupPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200 bg-white">
          <Sidebar activeItem="app-setup" />
        </div>

        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-6 pb-20 md:py-12">
            <header
              className="mb-10 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg"
              aria-labelledby="app-setup-title"
            >
              <div className="px-6 py-10 sm:px-10">
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium tracking-wide uppercase">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Web App Ready
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                    Real-time alerts
                  </span>
                </div>
                <h1
                  id="app-setup-title"
                  className="mt-6 text-3xl font-bold leading-tight sm:text-4xl"
                >
                  Install NailFeed and Stay Connected
                </h1>
                <p className="mt-4 max-w-3xl text-base text-white/90 sm:text-lg">
                  Take NailFeed with you everywhere! Add it to your home screen
                  just like a regular app, and turn on notifications so you
                  never miss new comments, followers, or mentions.
                </p>
              </div>
            </header>

            <section aria-labelledby="pwa-checklist-heading" className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle
                    id="pwa-checklist-heading"
                    className="flex items-center gap-3 text-xl"
                  >
                    <ShieldCheck
                      className="h-5 w-5 text-pink-500"
                      aria-hidden="true"
                    />
                    Before you start
                  </CardTitle>
                  <CardDescription>
                    To make sure everything works smoothly:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul
                    className="space-y-3 text-sm text-gray-700"
                    aria-label="Installation prerequisites"
                  >
                    <li className="flex items-start gap-3">
                      <Wifi
                        className="mt-0.5 h-4 w-4 text-pink-500"
                        aria-hidden="true"
                      />
                      Be connected to the internet.
                    </li>
                    <li className="flex items-start gap-3">
                      <Download
                        className="mt-0.5 h-4 w-4 text-pink-500"
                        aria-hidden="true"
                      />
                      Open NailFeed in your mobile browser (Safari on iPhone or
                      Chrome on Android) at least once so your device recognizes
                      it.
                    </li>
                    <li className="flex items-start gap-3">
                      <RefreshCcw
                        className="mt-0.5 h-4 w-4 text-pink-500"
                        aria-hidden="true"
                      />
                      If you installed it before, refresh the page to get the
                      latest updates and app icon.
                    </li>
                    <li className="flex items-start gap-3">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 text-pink-500"
                        aria-hidden="true"
                      />
                      Make sure notifications are allowed in your browser or
                      device settings.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            <section
              aria-labelledby="install-instructions-heading"
              className="mb-12"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-pink-100 p-3">
                  <Smartphone
                    className="h-6 w-6 text-pink-500"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2
                    id="install-instructions-heading"
                    className="text-2xl font-semibold text-gray-900"
                  >
                    Install NailFeed on Your Device
                  </h2>
                  <p className="text-sm text-gray-600">
                    Choose the guide that matches your phone. Follow these quick
                    steps to add NailFeed to your home screen and use it just
                    like a regular app.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2" role="list">
                <Card>
                  <article
                    role="listitem"
                    aria-labelledby="ios-install-heading"
                  >
                    <CardHeader>
                      <CardTitle
                        id="ios-install-heading"
                        className="flex items-center gap-3 text-lg"
                      >
                        <Smartphone
                          className="h-5 w-5 text-pink-500"
                          aria-hidden="true"
                        />
                        iPhone or iPad (Safari)
                      </CardTitle>
                      <CardDescription>
                        Safari handles Web App installs from the share sheet.
                        The prompt appears automatically when supported.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol
                        className="space-y-4 text-sm text-gray-700"
                        aria-label="Steps to install NailFeed on iOS"
                      >
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            1. Open NailFeed in Safari.
                          </span>
                          Make sure you are using Safari, not Chrome or Firefox
                          on iOS.
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            2. Tap the Share button.
                          </span>
                          <span className="flex items-center gap-2">
                            <Share
                              className="h-4 w-4 text-pink-500"
                              aria-hidden="true"
                            />
                            Look for the square icon with an upward arrow.
                          </span>
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            3. Choose Add to Home Screen.
                          </span>
                          Give the shortcut a name ("NailFeed" works great) and
                          confirm.
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            4. Launch NailFeed from your Home Screen.
                          </span>
                          The app now opens full screen without Safari chrome.
                        </li>
                      </ol>
                    </CardContent>
                  </article>
                </Card>

                <Card>
                  <article
                    role="listitem"
                    aria-labelledby="android-install-heading"
                  >
                    <CardHeader>
                      <CardTitle
                        id="android-install-heading"
                        className="flex items-center gap-3 text-lg"
                      >
                        <Smartphone
                          className="h-5 w-5 text-pink-500"
                          aria-hidden="true"
                        />
                        Android (Chrome, Edge, Brave)
                      </CardTitle>
                      <CardDescription>
                        Chromium browsers surface an install prompt using the
                        beforeinstallprompt event.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol
                        className="space-y-4 text-sm text-gray-700"
                        aria-label="Steps to install NailFeed on Android"
                      >
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">
                            1. Visit NailFeed in Chrome.
                          </span>
                          Wait a moment for the install banner. If you dismissed
                          it, open the browser menu.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">
                            2. Tap Install app or Add to Home screen.
                          </span>
                          The wording changes slightly by browser.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">
                            3. Confirm by tapping Install.
                          </span>
                          NailFeed will appear on your launcher and app drawer.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">
                            4. Allow background sync when prompted.
                          </span>
                          This keeps notifications and offline content up to
                          date.
                        </li>
                      </ol>
                    </CardContent>
                  </article>
                </Card>

                <Card className="lg:col-span-2">
                  <article
                    role="listitem"
                    aria-labelledby="desktop-install-heading"
                  >
                    <CardHeader>
                      <CardTitle
                        id="desktop-install-heading"
                        className="flex items-center gap-3 text-lg"
                      >
                        <Laptop
                          className="h-5 w-5 text-pink-500"
                          aria-hidden="true"
                        />
                        Desktop (Chrome, Edge, Arc)
                      </CardTitle>
                      <CardDescription>
                        Desktop Chromium browsers display an install icon in the
                        address bar when the manifest is ready.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol
                        className="grid gap-4 text-sm text-gray-700 sm:grid-cols-2"
                        aria-label="Steps to install NailFeed on desktop"
                      >
                        <li className="rounded-lg bg-indigo-50 p-3">
                          <span className="font-semibold">
                            1. Open NailFeed and look for the install icon.
                          </span>
                          It usually appears as a monitor with a downward arrow,
                          next to the star icon.
                        </li>
                        <li className="rounded-lg bg-indigo-50 p-3">
                          <span className="font-semibold">
                            2. Click Install NailFeed.
                          </span>
                          Confirm the dialog to create a standalone window on
                          your desktop.
                        </li>
                        <li className="rounded-lg bg-indigo-50 p-3">
                          <span className="font-semibold">
                            3. Pin NailFeed for quick access.
                          </span>
                          Pin it to your dock, task bar, or start menu just like
                          a native app.
                        </li>
                        <li className="rounded-lg bg-indigo-50 p-3">
                          <span className="font-semibold">
                            4. Enable launch on login (optional).
                          </span>
                          Most browsers let you auto-start Web Apps in their app
                          settings.
                        </li>
                      </ol>
                    </CardContent>
                  </article>
                </Card>
              </div>
            </section>

            <section aria-labelledby="notification-heading" className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-purple-100 p-3">
                  <BellRing
                    className="h-6 w-6 text-purple-500"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2
                    id="notification-heading"
                    className="text-2xl font-semibold text-gray-900"
                  >
                    Turn on NailFeed notifications
                  </h2>
                  <p className="text-sm text-gray-600">
                    Allow push notifications to receive alerts for new comments,
                    followers, mentions, and featured posts.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2" role="list">
                <Card>
                  <article
                    role="listitem"
                    aria-labelledby="enable-notifications-heading"
                  >
                    <CardHeader>
                      <CardTitle
                        id="enable-notifications-heading"
                        className="flex items-center gap-3 text-lg"
                      >
                        <Bell
                          className="h-5 w-5 text-pink-500"
                          aria-hidden="true"
                        />
                        Enable notifications in NailFeed
                      </CardTitle>
                      <CardDescription>
                        You will see this flow after signing in on web or from
                        the installed Web App.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol
                        className="space-y-4 text-sm text-gray-700"
                        aria-label="Steps to enable notifications in NailFeed"
                      >
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            1. Sign in and wait for the in-app prompt.
                          </span>
                          The NailFeed permission card slides in after a few
                          seconds.
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            2. Click Enable notifications.
                          </span>
                          We register your browser with our push service worker
                          and store your subscription securely.
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            3. Confirm the browser permission dialog.
                          </span>
                          Choose Allow so NailFeed can deliver real-time updates
                          even when the app is closed.
                        </li>
                        <li className="rounded-lg bg-pink-50 p-3">
                          <span className="font-semibold">
                            4. Verify from Settings.
                          </span>
                          In the installed app, go to{" "}
                          <strong>
                            Profile &gt; Settings &gt; Notifications
                          </strong>{" "}
                          to confirm the toggle is active.
                        </li>
                      </ol>
                    </CardContent>
                  </article>
                </Card>

                <Card>
                  <article
                    role="listitem"
                    aria-labelledby="browser-notification-settings-heading"
                  >
                    <CardHeader>
                      <CardTitle
                        id="browser-notification-settings-heading"
                        className="flex items-center gap-3 text-lg"
                      >
                        <Settings
                          className="h-5 w-5 text-pink-500"
                          aria-hidden="true"
                        />
                        If you blocked notifications earlier
                      </CardTitle>
                      <CardDescription>
                        Grant permission manually through your browser or system
                        preferences, then reload NailFeed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul
                        className="space-y-4 text-sm text-gray-700"
                        aria-label="Steps to re-enable notifications"
                      >
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">Safari on iOS:</span>{" "}
                          Settings &gt; Notifications &gt; NailFeed &gt; Allow
                          Notifications.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">Android Chrome:</span>{" "}
                          Chrome settings &gt; Site settings &gt; Notifications
                          &gt; NailFeed &gt; Allow.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">
                            Desktop Chrome/Edge:
                          </span>{" "}
                          Click the lock icon in the address bar, set
                          Notifications to Allow, then refresh.
                        </li>
                        <li className="rounded-lg bg-purple-50 p-3">
                          <span className="font-semibold">Test it:</span> Use
                          the <strong>Send test notification</strong>
                          button in Profile settings to confirm everything is
                          working.
                        </li>
                      </ul>
                    </CardContent>
                  </article>
                </Card>
              </div>
            </section>

            <section
              aria-labelledby="troubleshooting-heading"
              className="mb-12"
            >
              <Alert>
                <AlertTitle id="troubleshooting-heading">
                  Need to troubleshoot?
                </AlertTitle>
                <AlertDescription className="space-y-3 text-sm">
                  <p>
                    The NailFeed service worker automatically updates and caches
                    the latest assets. If something looks out of date, open the
                    in-app menu and choose <strong>Refresh app</strong>, or hard
                    reload the page.
                  </p>
                </AlertDescription>
              </Alert>
            </section>

            <section aria-labelledby="whats-next-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="whats-next-heading" className="text-xl">
                    What to expect after installing
                  </CardTitle>
                  <CardDescription>
                    NailFeed behaves like a native app once added to your
                    device. Here are a few tips to get the most out of it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-4 text-sm text-gray-700 sm:grid-cols-2">
                    <li className="rounded-lg bg-white p-4 shadow-sm">
                      <span className="block font-semibold">
                        Offline-ready browsing
                      </span>
                      Recently viewed posts and collections stay available even
                      if you lose connection momentarily.
                    </li>
                    <li className="rounded-lg bg-white p-4 shadow-sm">
                      <span className="block font-semibold">
                        Background sync
                      </span>
                      We quietly sync new comments and follower updates so
                      notifications arrive as soon as they happen.
                    </li>
                    <li className="rounded-lg bg-white p-4 shadow-sm">
                      <span className="block font-semibold">
                        Unified experience
                      </span>
                      The installed web app shares your session with the browser
                      version, so you can switch devices seamlessly.
                    </li>
                    <li className="rounded-lg bg-white p-4 shadow-sm">
                      <span className="block font-semibold">Easy feedback</span>
                      Something missing? Head to
                      <Link
                        href="/suggestions"
                        className="ml-1 font-medium text-pink-600 underline underline-offset-4"
                      >
                        Community Ideas
                      </Link>
                      and share a feature request.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav activeTab="menu" />
      </div>
    </main>
  );
}
