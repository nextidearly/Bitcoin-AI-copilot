"use client";

import Script from "next/script";
import Link from "next/link";
import "../../public/css/bitx-01e4b4.webflow.css";

export default function Home() {
  return (
    <>
      <div className="section wf-section">
        <div
          data-w-id="f2772509-f4cd-a695-64d9-c4861115963f"
          style={{ opacity: 0.9 }}
          className="div-block"
        ></div>
        <div
          data-w-id="aed9a767-0bf7-54fb-d3dd-925a5df24b41"
          className="div-block _2"
        ></div>
        <div className="div-block-2"></div>
        <div className="div-block-3"></div>

        <div className="div-block-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div
                className="w-col w-col-6 items-center"
                style={{ display: "flex", alignItems: "center" }}
              >
                <a className="w-inline-block" href="#">
                  <img src="/images/x.png" className="image" alt="logo" />
                </a>
                <h3 className="logo-text m-0">BitX</h3>
              </div>

              <div className="column w-col w-col-6">
                <div
                  style={{ display: "flex", gap: "20px", alignItems: "center" }}
                >
                  <a
                    href="https://zealy.io/c/bitxbrc20dex/questboard"
                    className="w-inline-block"
                  >
                    <img
                      src="/images/zealy.png"
                      className="image"
                      alt="zealy"
                    />
                  </a>
                  <a
                    href="https://t.me/+dAfQrta0lfI0ODk8"
                    className="w-inline-block"
                  >
                    <img
                      src="/images/tg.png"
                      className="image"
                      alt="telegram"
                    />
                  </a>
                  <a
                    href="https://twitter.com/BitX_Brc20"
                    className="w-inline-block"
                  >
                    <img
                      src="/images/twitter.png"
                      className="image"
                      alt="twitter"
                    />
                  </a>
                  <a
                    href="https://discord.gg/Yr2YNzffsC"
                    className="w-inline-block"
                  >
                    <img
                      src="/images/icons8-discord-120.png"
                      className="image"
                      alt="discord"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "75%" }}>
              <h1 className="heading">BitX Bitcoin AI Copilot</h1>
              <h2 className="description-text">
                Intelligent Copilot elevating your Bitcoin experience
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="button-block">
              <Link className="btn btn-outline-primary button-app" href="/home" style={{ background: "white", textAlign: "center", textDecoration: "none", color: "#333333" }}>
                <span className="button-h">Chat</span>
              </Link>
              <button
                className="btn btn-outline-light button-app border border-white"
                onClick={() => window.open("https://docs.bxdx.io/")}
              >
                <span className="button-h">Docs</span>
              </button>
            </div>
          </div>

          <div className="columns w-row">
            <div className="column-2 w-col w-col-6">
              <h1 className="heading-3">© 2023 BitX | All Rights Reserved</h1>
            </div>
            <div className="column-3 w-col w-col-6">
              <h1 className="heading-3">Don't trust, Verify!</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Scripts */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
        strategy="beforeInteractive"
      />
      <Script id="webfont-loader" strategy="beforeInteractive">
        {`WebFont.load({ google: { families: ["Inconsolata:400,700"] } });`}
      </Script>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.3/html5shiv.min.js"
        strategy="beforeInteractive"
      />

      <Script id="webflow-touch" strategy="beforeInteractive">
        {`
          (function(o, c) {
            var n = c.documentElement, t = " w-mod-";
            n.className += t + "js";
            if ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) {
              n.className += t + "touch";
            }
          })(window, document);
        `}
      </Script>

      <Script
        src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=63ff2c1cb965c64cde6994d8"
        strategy="beforeInteractive"
        integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
        crossOrigin="anonymous"
      />

      <Script src="/js/webflow.js" strategy="afterInteractive" />
    </>
  );
}
