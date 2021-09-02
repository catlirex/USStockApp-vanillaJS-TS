import { Chart } from "chart.js";
import "./styles/style.css";

const plugin = {
  id: "custom_canvas_background_color",
  beforeDraw: (chart: any) => {
    const ctx = chart.canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "whitesmoke";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

type WatchListType = {
  name: string;
  symbol: string;
  price: number;
  currentChange: number;
  id: number;
};

type StockDataType = {
  symbol: string;
  shortName: string;
  currentPrice: number;
  currentChange: number;
};

type NewsFeedType = {
  title: string;
  url: string;
  publisher: string;
  publishedAt: number;
  summary: string;
  img: string | null;
};

type ChatDataSetType = {
  label: string;
  data: number;
  borderColor: string;
};

type LineChartDisplayDataType = {
  labels: string[];
  datasets: ChatDataSetType[];
};

type BarChartDisplayData = {
  labels: string[];
  datasets: [
    {
      label: string;
      data: string[];
      backgroundColor: "grey";
    }
  ];
};

type BarChartConfigType = {
  type: "bar";
  data: BarChartDisplayData | {};
  options: {
    responsive: false;
  };
  plugins: any[];
};

type ChatDataType = {
  dateConverted: string[];
  lineChartDisplayData: LineChartDisplayDataType | {};
  lineChartConfig: {
    type: "line";
    data: LineChartDisplayDataType | {};
    options: {
      title: {
        display: true;
        text: "1M";
        color: "white";
      };
      responsive: false;
    };
    plugins: any[];
  };
  barConvertedData: string[];
  barChartDisplayData: BarChartDisplayData | {};
  barChartConfig: BarChartConfigType;
};

type StateType = {
  watchList: WatchListType[];
  selectedStock: number | null;
  stockData: StockDataType | null;
  previousStockData: StockDataType | null;
  newsData: NewsFeedType[];
  chartsData: ChatDataType;
};

let state: StateType = {
  watchList: [],
  selectedStock: null,
  stockData: null,
  previousStockData: null,
  newsData: [],
  chartsData: {
    dateConverted: [],
    lineChartDisplayData: {},
    lineChartConfig: {
      type: "line",
      data: {},
      options: {
        title: {
          display: true,
          text: "1M",
          color: "white",
        },
        responsive: false,
      },
      plugins: [plugin],
    },
    barConvertedData: [],
    barChartDisplayData: {},
    barChartConfig: {
      type: "bar",
      data: {},
      options: {
        responsive: false,
      },
      plugins: [plugin],
    },
  },
};

const header = document.querySelector(".main-header");
const newsContainer = document.querySelector(".related-news-container");

// STATE FUNCTIONS
const setState = (stockToUpdate: { [key: string]: any }) => {
  state = { ...state, ...stockToUpdate };

  render();
};

// SERVER FUNCTIONS
const getStocksFromServer = () => {
  return fetch("http://localhost:4000/watchList").then(function (response) {
    return response.json();
  });
};
const deleteStockFromServer = (stockId: number) => {
  return fetch(`http://localhost:4000/watchList/${stockId}`, {
    method: "DELETE",
  }).then(function (response) {
    return response.json();
  });
};

const addStockToServer = (stock: {
  name: string;
  symbol: string;
  price: number;
  currentChange: number;
}) => {
  return fetch(`http://localhost:4000/watchList`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stock),
  }).then(function (response) {
    return response.json();
  });
};

function updateWatchListPriceFromAPI() {
  let watchListSymbol = [];
  for (const stock of state.watchList) {
    watchListSymbol.push(stock.symbol);
  }

  getUpdatedPrice(watchListSymbol).then(function (data) {
    console.log(data);
    let updatedWatchList = [];
    for (let i = 0; i < data.quoteResponse.result.length; i++) {
      let updatedStock = { ...state.watchList[i] };
      updatedStock.price = data.quoteResponse.result[i].regularMarketPrice;
      updatedStock.currentChange =
        data.quoteResponse.result[i].regularMarketChange;

      updatedWatchList.push(updatedStock);
    }

    state.watchList = [...updatedWatchList];
    for (const stock of state.watchList) {
      patchStockPriceToServer(stock);
    }
  });
}

function patchStockPriceToServer(stock: WatchListType) {
  return fetch(`http://localhost:4000/watchList/${stock.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stock),
  }).then(function (response) {
    return response.json();
  });
}

function getUpdatedPrice(watchListSymbol: string[]) {
  return fetch(
    `https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=US&symbols=${watchListSymbol.join(
      "%2C"
    )}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": "216b955a3emsh1c9e90acee647bfp11ec98jsn4d8af370f408",
        "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => {
      console.error(err);
    });
}

function getStockSummary(stockSymbol: string) {
  return fetch(
    `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=${stockSymbol}&region=US`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": "216b955a3emsh1c9e90acee647bfp11ec98jsn4d8af370f408",

        "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => {
      console.error(err);
    });
}

function getSearchRelatedNews(stockSymbol: string) {
  return fetch(
    `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/get-news?category=${stockSymbol}&region=US`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": "216b955a3emsh1c9e90acee647bfp11ec98jsn4d8af370f408",

        "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => {
      console.error(err);
    });
}

function searchStock() {
  let searchForm = document.querySelector<HTMLFormElement>(".search-form");

  searchForm?.addEventListener("submit", function (event) {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      search: { value: string };
    };

    getStockSummary(target.search.value).then(function (data) {
      let usefulData = {
        symbol: data.symbol,
        shortName: data.price.shortName,
        currentPrice: data.price.regularMarketPrice.raw,
        currentChange: data.price.regularMarketChange.raw,
      };

      setState({ stockData: usefulData });
    });

    getSearchRelatedNews(target.search.value).then(function (newsData) {
      let formattedArray = [];
      for (let i = 0; i < 10; i++) {
        let usefulNewsData: NewsFeedType = {
          title: newsData.items.result[i].title,
          url: newsData.items.result[i].link,
          publisher: newsData.items.result[i].publisher,
          publishedAt: newsData.items.result[i].published_at,
          summary: newsData.items.result[i].summary,
          img: null,
        };

        if (newsData.items.result[i].main_image !== null) {
          usefulNewsData.img = newsData.items.result[i].main_image.original_url;
        }

        formattedArray.push(usefulNewsData);
      }

      setState({ newsData: [...formattedArray] });
    });
  });
}

function renderHeader() {
  if (state.stockData === null || header === null) return;
  header.innerHTML = "";
  let stockNameDiv = document.createElement("div");
  stockNameDiv.className = "stock-name";
  let symbolH1 = document.createElement("h1");
  symbolH1.innerText = state.stockData.symbol;
  let nameH2 = document.createElement("h2");
  nameH2.innerText = state.stockData.shortName;
  stockNameDiv.append(symbolH1, nameH2);

  let priceContainer = document.createElement("div");
  priceContainer.className = "price-container";
  let currentPrice = document.createElement("p");
  currentPrice.className = "current-price";
  currentPrice.innerText = String(state.stockData.currentPrice);

  let priceDiff = document.createElement("p");
  priceDiff.className = "price-difference";
  if (state.stockData.currentChange > 0)
    priceDiff.innerText = `+ ${state.stockData.currentChange.toFixed(2)}`;
  if (state.stockData.currentChange < 0)
    priceDiff.innerText = state.stockData.currentChange.toFixed(2);

  changeInnerTextColor(priceDiff, state.stockData.currentChange);

  priceContainer.append(currentPrice, priceDiff);
  header.append(stockNameDiv, priceContainer);
  renderWatchListBtn();
}

function changeInnerTextColor(
  element: HTMLParagraphElement,
  changeNumber: number
) {
  if (changeNumber >= 0) element.style.color = "rgb(235, 15, 42)";
  if (changeNumber < 0) element.style.color = "rgb(235, 15, 42)";
}

function renderWatchListBtn() {
  let watchListBtn = document.createElement("button");
  watchListBtn.className = "round-end watchlist-action";

  let watchListCheck = state.watchList.find(
    (target) => target.symbol === state.stockData?.symbol
  );

  if (!watchListCheck) {
    watchListBtn.innerText = "Add to Watchlist";
  } else {
    watchListBtn.innerText = "Remove from Watchlist";
    watchListBtn.style.backgroundColor = "rgb(120, 163, 186)";
    state.selectedStock = watchListCheck.id;
  }

  watchListBtn.addEventListener("click", function () {
    if (!state.stockData) return alert("Action Failed, please try again later");
    const stock = {
      name: state.stockData.shortName,
      symbol: state.stockData.symbol,
      price: state.stockData.currentPrice,
      currentChange: state.stockData.currentChange,
    };
    if (watchListCheck === undefined) {
      addStockToServer(stock).then(function (newStockFromServer) {
        setState({ watchList: [...state.watchList, newStockFromServer] });
      });
    } else {
      if (!state.selectedStock)
        return alert("Fail to del from Watch list, please try again later");
      deleteStockFromServer(state.selectedStock).then(function () {
        const filteredStocks = state.watchList.filter(function (targetedStock) {
          return targetedStock.id !== state.selectedStock;
        });
        console.log(filteredStocks);
        setState({ watchList: filteredStocks });
      });
    }
  });

  header?.append(watchListBtn);
}

function renderNewsCard(newsData: NewsFeedType) {
  let newsCard = document.createElement("a");
  newsCard.className = "news-card";
  newsCard.setAttribute("href", newsData.url);
  newsCard.setAttribute("target", "_blank");
  newsContainer?.append(newsCard);

  let publisher = document.createElement("span");
  publisher.className = "news-publisher";
  publisher.innerText = newsData.publisher;
  let publishDate = document.createElement("span");
  publishDate.className = "publish-date";
  let dateFormatted = convertEpochTimeToBST(newsData.publishedAt);
  publishDate.innerText = dateFormatted;
  let newsTitle = document.createElement("h2");
  newsTitle.className = "news-title";
  newsTitle.innerText = newsData.title;
  newsCard.append(publisher, publishDate, newsTitle);

  if (newsData.img) {
    let newsImg = document.createElement("img");
    newsImg.className = "news-image";
    newsImg.setAttribute("src", newsData.img);
    newsImg.setAttribute("alt", newsData.title);
    newsCard.append(newsImg);
  } else {
    newsCard.style.height = "fit-content";
  }

  let newsSummary = document.createElement("p");
  newsSummary.className = "summary";
  newsSummary.innerText = `${newsData.summary.substr(0, 230)} ...`;
  newsCard.append(newsSummary);
}

function convertEpochTimeToBST(epochValue: number) {
  const milliseconds = epochValue * 1000;
  const dateObject = new Date(milliseconds);
  const options: {
    month: "numeric";
    day: "numeric";
    hour: "numeric";
    minute: "numeric";
  } = {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const formatDate = dateObject.toLocaleString("en-GB", options);
  return formatDate;
}

function renderAllNewsCard() {
  if (!newsContainer) return;
  newsContainer.innerHTML = "";
  let tenNews = state.newsData.slice(0, 10);
  for (const news of tenNews) {
    renderNewsCard(news);
  }
}

/* LEFT SIDE STOCK WATCH LIST RENDER FUNCTIONS */
const stockUlEl = document.querySelector(".stock-list");
const renderWatchList = () => {
  if (!stockUlEl) return;
  stockUlEl.innerHTML = "";
  for (const stock of state.watchList) {
    let stockLiEl = renderStock(stock);

    stockUlEl.append(stockLiEl);
  }
};

const renderStock = (stock: WatchListType) => {
  let stockLiEl = document.createElement("li");
  stockLiEl.className = "stock-list-item";
  stockLiEl.addEventListener("click", function () {
    // setState({ selectedStock: stock.id });
    state.selectedStock = stock.id;
    getStockSummary(stock.symbol).then(function (data) {
      let usefulData = {
        symbol: data.symbol,
        shortName: data.price.shortName,
        currentPrice: data.price.regularMarketPrice.raw,
        currentChange: data.price.regularMarketChange.raw,
      };

      setState({ stockData: usefulData });
      // renderSearch();
    });

    getSearchRelatedNews(stock.symbol).then((newsData) => {
      let formattedArray = [];
      for (let i = 0; i < 10; i++) {
        let usefulNewsData = {
          title: newsData.items.result[i].title,
          url: newsData.items.result[i].link,
          publisher: newsData.items.result[i].publisher,
          publishedAt: newsData.items.result[i].published_at,
          summary: newsData.items.result[i].summary,
          img: null,
        };

        if (newsData.items.result[i].main_image !== null) {
          usefulNewsData.img = newsData.items.result[i].main_image.original_url;
        }

        formattedArray.push(usefulNewsData);
      }

      setState({ newsData: [...formattedArray] });
      console.log(state);
    });
    displayChart();
  });

  const stockPrice = document.createElement("span");
  stockPrice.className = "stock-price";
  const stockName = document.createElement("span");
  stockName.className = "stock-name";
  const stockChange = document.createElement("span");
  stockChange.className = "price-change";

  for (const key in stock) {
    if (key === "symbol") {
      stockLiEl.innerText = stock[key];
    }
    if (key === "price") {
      stockPrice.innerText = String(stock[key]);
    }
    if (key === "name") {
      stockName.innerText = stock[key];
    }
    if (key === "currentChange") {
      stockChange.innerText = stock[key].toFixed(2);
      if (Number(stock[key]) >= 0)
        stockChange.style.backgroundColor = "rgb(4, 176, 81)";
      if (Number(stock[key]) < 0)
        stockChange.style.backgroundColor = "rgb(235, 15, 42)";
    }
  }

  stockLiEl.append(stockPrice, stockName, stockChange);

  return stockLiEl;
};

// MAIN RENDER
const render = () => {
  displayChart();
  renderHeader();
  renderAllNewsCard();
  renderWatchList();
};

// chartFunction
function getChatData(symbol: string, interval: string, range: string) {
  return fetch(
    `https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-chart?interval=${interval}&symbol=${symbol}&range=${range}&region=US`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": "216b955a3emsh1c9e90acee647bfp11ec98jsn4d8af370f408",
        "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
      },
    }
  )
    .then((response) => response.json())
    .catch((err) => {
      console.error(err);
    });
}

function convertEpochTimeToEST(epochValue: number) {
  const milliseconds = epochValue * 1000;
  const dateObject = new Date(milliseconds);
  const options: {
    month: "numeric";
    day: "numeric";
  } = {
    month: "numeric",
    day: "numeric",
  };
  const formatDate = dateObject.toLocaleString("en-US", options);
  state.chartsData.dateConverted.push(formatDate);
}

function processChartData(symbol: string, interval = "1d", range = "1mo") {
  getChatData((symbol = "AAPL"), interval, range)
    .then(function (chartData) {
      // console.log(chartData);
      state.chartsData.dateConverted = [];

      let timeLabel = chartData.chart.result[0].timestamp;
      timeLabel.map(convertEpochTimeToEST);
      state.chartsData.lineChartDisplayData = {
        labels: state.chartsData.dateConverted,
        datasets: [
          {
            label: "Daily Low",
            data: chartData.chart.result[0].indicators.quote[0].low,
            borderColor: "darkred",
          },
          {
            label: "Close Price",
            data: chartData.chart.result[0].indicators.quote[0].close,
            borderColor: "rgb(21, 220, 220)",
            backgroundColor: "rgba(21, 220, 220, 0.3)",
          },
          {
            label: "Daily High",
            data: chartData.chart.result[0].indicators.quote[0].high,
            borderColor: "green",
          },
        ],
      };
      state.chartsData.lineChartConfig.data =
        state.chartsData.lineChartDisplayData;
      let barRawData = chartData.chart.result[0].indicators.quote[0].volume;
      let minBarData = Math.min(...barRawData);
      console.log(barRawData);
      let barLabel = convertBarDataReturnLabel(minBarData, barRawData);

      state.chartsData.barChartDisplayData = {
        labels: state.chartsData.dateConverted,
        datasets: [
          {
            label: barLabel,
            data: state.chartsData.barConvertedData,
            backgroundColor: "grey",
          },
        ],
      };
      state.chartsData.barChartConfig.data =
        state.chartsData.barChartDisplayData;
    })
    .then(function () {
      renderChart();
    });
}

function renderChart() {
  let lineContainer = document.getElementById("line-chart");
  if (!lineContainer) return;
  new Chart(lineContainer, state.chartsData.lineChartConfig);

  let barContainer = document.getElementById("bar-chart");
  if (!barContainer) return;
  new Chart(barContainer, state.chartsData.barChartConfig);
}

function convertBarDataReturnLabel(minBarData: number, barRawData: number[]) {
  if (minBarData >= 1.0e9) {
    state.chartsData.barConvertedData = barRawData.map((num) =>
      (Math.abs(Number(num)) / 1.0e9).toFixed(2)
    );
    return "Volume(billions)";
  } else if (minBarData >= 1.0e6) {
    state.chartsData.barConvertedData = barRawData.map((num) =>
      (Math.abs(Number(num)) / 1.0e6).toFixed(2)
    );
    return "Volume(millions)";
  } else if (minBarData >= 1.0e3) {
    state.chartsData.barConvertedData = barRawData.map((num) =>
      (Math.abs(Number(num)) / 1.0e3).toFixed(2)
    );
    return "Volume(thousands)";
  } else {
    state.chartsData.barConvertedData = barRawData.map((num) => num.toFixed(2));
    return "";
  }
}

function displayChart() {
  if (state.stockData === null) return;
  if (
    state.previousStockData &&
    state.previousStockData.symbol === state.stockData.symbol
  )
    return;
  state.previousStockData = state.stockData;

  let chartBtnBar =
    document.querySelector<HTMLButtonElement>(".chart-button-bar");
  if (!chartBtnBar) return;
  chartBtnBar.style.display = "block";
  processChartData(state.stockData.symbol);
}

function displayChartEvents() {
  let fiveDayChart = document.getElementById("5D");
  if (!fiveDayChart) return;
  fiveDayChart.addEventListener("click", () => {
    if (state.stockData) processChartData(state.stockData.symbol, "1d", "5d");
  });

  let oneMonthChart = document.getElementById("1M");
  if (!oneMonthChart) return;
  oneMonthChart.addEventListener("click", () => {
    if (state.stockData) processChartData(state.stockData.symbol, "1d", "1mo");
  });

  let threeMonthChart = document.getElementById("3M");
  if (!threeMonthChart) return;
  threeMonthChart.addEventListener("click", () => {
    if (state.stockData) processChartData(state.stockData.symbol, "1d", "3mo");
  });

  let sixMonthChart = document.getElementById("6M");
  if (!sixMonthChart) return;
  sixMonthChart.addEventListener("click", () => {
    if (state.stockData) processChartData(state.stockData.symbol, "1d", "6mo");
  });

  let oneYearChart = document.getElementById("1Y");
  if (!oneYearChart) return;
  oneYearChart.addEventListener("click", () => {
    if (state.stockData) processChartData(state.stockData.symbol, "1d", "1y");
  });
}

const startApp = () => {
  getStocksFromServer().then((stocksFromServer: WatchListType[]) => {
    state.watchList = [...stocksFromServer];
    render();
    displayChartEvents();
    searchStock();
    updateWatchListPriceFromAPI();
  });
};

startApp();
