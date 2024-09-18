//packageを指定
const express = require("express");
const axios = require("axios");
const path = require("path");
const app = express();

app.use(express.json());

app.get("/nba", (req, res) => {
  res.sendFile(path.join(__dirname, "musics/nba.html"));
});

//ここからBot関連

// 入手したURLリストのURLを1つずつに
app.get("/get_urls", async (req, res) => {
  const urls = req.query.urls;
  const urlList = urls.split(",").map((url) => url.trim());
  res.status(200).json({ urlList });
});

// 入手したURLリストを更新
app.post("/edit_value", async (req, res) => {
  const webhookUrl = req.query.url;
  const urls = req.body.urls;

  //文字列として有効かを確認
  if (!webhookUrl) {
    return res.status(400).json({ error: "Webhook URL is required." });
  }
  if (!urls) {
    return res.status(400).json({ error: "URLs parameter is required." });
  }

  //URLリストを更新
  let updatedUrls = urls
    .split(",")
    .filter((url) => url.trim() !== webhookUrl.trim())
    .join(", ");

  //結果をレスポンス
  res.status(200).json({ updatedUrls });
});

//Webhookを使用した通知システムをテスト
app.post("/webhook_test", async (req, res) => {
  const message = req.body.message;
  const urls = req.body.urls;

  //URLをリスト化
  const webhookUrls = urls.split(",").map((url) => url.trim());

  //Embedを設定
  const embed = {
    title: "テスト",
    description: `これはテストメッセージです。\n\n${message}`,
    color: 0x00d5ff,
  };

  //通知を送信
  const promises = webhookUrls.map((url) =>
    axios
      .post(url, {
        username: "TakasumiBOT Trade Notify",
        avatar_url:
          "https://cdn.glitch.global/daee4a4f-c7dd-4cf2-938e-85f0f64d900a/IMG_20240721_202813-removebg-preview.png?v=1724809255382",
        embeds: [embed],
      })
      .catch((error) => ({ error, url }))
  );

  //エラーハンドリング
  try {
    const results = await Promise.all(promises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      const rateLimitErrors = errors.filter(
        ({ error }) => error.response && error.response.status === 429
      );

      if (rateLimitErrors.length > 0) {
        const retryAfter =
          rateLimitErrors[0].error.response.headers["retry-after"];
        const retryAfterSeconds = parseInt(retryAfter, 10);
        const minutes = Math.floor(retryAfterSeconds / 60);
        const seconds = retryAfterSeconds % 60;
        return res.status(429).json({
          error: "レートリミット制限に達しました。",
          retryAfter: `${minutes}分${seconds}秒後に再試行してください。`,
        });
      }

      // エラーの詳細をレスポンスに含める
      const detailedErrors = errors.map(({ error, url }) => ({
        url,
        status: error.response ? error.response.status : "N/A",
        headers: error.response ? error.response.headers : "N/A",
        body: error.response ? error.response.data : "N/A",
        message: error.message,
      }));

      return res.status(500).json({
        message: "Webhookの通知送信に失敗しました。",
        errors: detailedErrors,
      });
    }

    //成功レスポンス
    res
      .status(200)
      .json({ message: "通知がすべてのWebhookに正常に送信されました" });
    console.log("通知が全てのWehbookに正常に送信されました");
  } catch (error) {
    console.error("Error sending webhook:", error.message);

    //失敗レスポンス
    res.status(500).json({
      error: "Webhookの通知送信に失敗しました。",
      data: {
        message: error.message,
        status: error.response ? error.response.status : null,
        headers: error.response ? error.response.headers : null,
        body: error.response ? error.response.data : null,
      },
    });
  }
});

// 入手したURLリストのURLにメッセージを送信
app.post("/webhook_sent", async (req, res) => {
  console.log("通知送信のリクエストを受信しました。");
  const price = req.body.p;
  const difference = req.body.d;
  const urls = req.body.urls;
  console.log(`株価 : ${price}コイン\n変動額 : ${difference}コイン`);

  // urlsパラメーターが正しいか確認
  if (!urls || typeof urls !== "string") {
    return res.status(400).json({ error: "urlsパラメータが必要です。" });
  }

  // Setを使って重複を排除
  const webhookUrls = [...new Set(urls.split(",").map((url) => url.trim()))];

  // Embedを設定
  const embed = {
    title: "株式情報",
    description: `株価 : ${price}コイン\n変動額 : ${difference}コイン`,
    color: 0x00d5ff,
    footer: {
      text: "株価が変動する場合がありますので、ご自身でコマンドを実行してご確認ください。",
    },
  };

  // 通知を送信
  const promises = webhookUrls.map((url) =>
    axios
      .post(url, {
        username: "TakasumiBOT Trade Notify",
        avatar_url:
          "https://cdn.glitch.global/daee4a4f-c7dd-4cf2-938e-85f0f64d900a/IMG_20240721_202813-removebg-preview.png?v=1724809255382",
        embeds: [embed],
      })
      .catch((error) => ({ error, url }))
  );

  // エラーハンドリング
  try {
    const results = await Promise.all(promises);
    const errors = results.filter((result) => result.error);

    if (errors.length > 0) {
      const rateLimitErrors = errors.filter(
        ({ error }) => error.response && error.response.status === 429
      );

      if (rateLimitErrors.length > 0) {
        const retryAfter =
          rateLimitErrors[0].error.response.headers["retry-after"];
        const retryAfterSeconds = parseInt(retryAfter, 10);
        const minutes = Math.floor(retryAfterSeconds / 60);
        const seconds = retryAfterSeconds % 60;
        return res.status(429).json({
          error: "レートリミット制限に達しました。",
          retryAfter: `${minutes}分${seconds}秒後に再試行してください。`,
        });
      }

      // エラーの詳細を含むレスポンス
      const detailedErrors = errors.map(({ error, url }) => ({
        url,
        status: error.response ? error.response.status : "N/A",
        headers: error.response ? error.headers : "N/A",
        body: error.response ? error.response.data : "N/A",
        message: error.message,
      }));

      // エラーの詳細をログに表示
      console.log("通知の送信に失敗しました。");
      detailedErrors.forEach((err) => {
        console.log(`message = ${err.message}`);
        console.log(`url = ${err.url}`);
        console.log(`status = ${err.status}`);
        console.log(`headers = ${err.headers}`);
        console.log(`body = ${err.body}`);
      });

      return res.status(500).json({
        message: "Webhookの通知送信に失敗しました。",
        errors: detailedErrors,
      });
    }

    // 成功レスポンス
    res
      .status(200)
      .json({ message: "通知がすべてのWebhookに正常に送信されました" });
    console.log("通知が全てのWebhookに正常に送信されました");
  } catch (error) {
    console.error("Error sending webhook:", error.message);

    // 失敗レスポンス
    res.status(500).json({
      error: "Webhookの通知の送信に失敗しました。",
      message: error.message,
    });
  }
});

// TakasumiBOTの株式情報を収得
app.get("/get_t_info", async (req, res) => {
  console.log(`株式情報のデータリクエストを受信しました。`);
  try {
    //TakasumiBOT API から株式情報を入手
    const response = await axios.get("https://api.takasumibot.com/v1/trade");

    //株式情報データを処理
    const data = response.data.data;
    const lastIndex = data.length - 1;
    const price = parseFloat(data[lastIndex]["1"]); // 数値に変換
    const previousPriceValue = parseFloat(data[lastIndex - 1]["1"]);
    const different = price - previousPriceValue;
    const difference =
      different > 0
        ? `+${different}`
        : different < 0
        ? different.toString()
        : `±${different}`;

    //ログに出力
    console.log(`株価 : ${price}コイン\n変動額 : ${difference}コイン`);

    //結果をレスポンス
    res.status(200).json({
      success: "true",
      data: {
        price,
        difference,
      },
    });
  } catch (error) {
    console.error(
      "TakasumiBOTの株式情報の収得中にエラーが発生しました:",
      error.message
    );
    res.status(500).json({ error: "株式情報の取得に失敗しました。" });
  }
});

//ここまでがBot関連

// サーバーの起動
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
