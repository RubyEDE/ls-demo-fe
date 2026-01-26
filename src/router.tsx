import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout";
import { TradePage } from "./pages/trade";
import { FaucetPage } from "./pages/faucet";
import { TalentsPage } from "./pages/talents";
import { AchievementsPage } from "./pages/achievements";
import { ReferralsPage } from "./pages/referrals";
import { LoadingPage } from "./pages/loading";
import { ErrorPage } from "./pages/error";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <TradePage />,
      },
      {
        path: "faucet",
        element: <FaucetPage />,
      },
      {
        path: "talents",
        element: <TalentsPage />,
      },
      {
        path: "achievements",
        element: <AchievementsPage />,
      },
      {
        path: "referrals",
        element: <ReferralsPage />,
      },
      {
        path: "loading",
        element: <LoadingPage />,
      },
    ],
  },
]);
