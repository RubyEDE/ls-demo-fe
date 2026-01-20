import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout";
import { TradePage } from "./pages/trade";
import { FaucetPage } from "./pages/faucet";
import { AchievementsPage } from "./pages/achievements";
import { ReferralsPage } from "./pages/referrals";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
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
        path: "achievements",
        element: <AchievementsPage />,
      },
      {
        path: "referrals",
        element: <ReferralsPage />,
      },
    ],
  },
]);
