package sendurl

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"gitlab.com/gitlab-org/labkit/mask"

	"gitlab.com/gitlab-org/gitlab/workhorse/internal/config"
	"gitlab.com/gitlab-org/gitlab/workhorse/internal/helper/fail"
	"gitlab.com/gitlab-org/gitlab/workhorse/internal/log"
	"gitlab.com/gitlab-org/gitlab/workhorse/internal/senddata"
	"gitlab.com/gitlab-org/gitlab/workhorse/internal/transport"
)

type entry struct{ senddata.Prefix }

type entryParams struct {
	URL                   string
	AllowRedirects        bool
	DialTimeout           config.TomlDuration
	ResponseHeaderTimeout config.TomlDuration
	ErrorResponseStatus   int
	TimeoutResponseStatus int
	Body                  string
	Header                http.Header
	Method                string
}

var SendURL = &entry{"send-url:"}

var rangeHeaderKeys = []string{
	"If-Match",
	"If-Unmodified-Since",
	"If-None-Match",
	"If-Modified-Since",
	"If-Range",
	"Range",
}

// Keep cache headers from the original response, not the proxied response. The
// original response comes from the Rails application, which should be the
// source of truth for caching.
var preserveHeaderKeys = map[string]bool{
	"Cache-Control": true,
	"Expires":       true,
	"Date":          true, // Support for HTTP 1.0 proxies
	"Pragma":        true, // Support for HTTP 1.0 proxies
}

var httpClientNoRedirect = func(req *http.Request, via []*http.Request) error {
	return http.ErrUseLastResponse
}

var (
	sendURLRequests = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gitlab_workhorse_send_url_requests",
			Help: "How many send URL requests have been processed",
		},
		[]string{"status"},
	)
	sendURLOpenRequests = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "gitlab_workhorse_send_url_open_requests",
			Help: "Describes how many send URL requests are open now",
		},
	)
	sendURLBytes = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "gitlab_workhorse_send_url_bytes",
			Help: "How many bytes were passed with send URL",
		},
	)

	sendURLRequestsInvalidData   = sendURLRequests.WithLabelValues("invalid-data")
	sendURLRequestsRequestFailed = sendURLRequests.WithLabelValues("request-failed")
	sendURLRequestsSucceeded     = sendURLRequests.WithLabelValues("succeeded")
)

func (e *entry) Inject(w http.ResponseWriter, r *http.Request, sendData string) {
	var params entryParams

	sendURLOpenRequests.Inc()
	defer sendURLOpenRequests.Dec()

	if err := e.Unpack(&params, sendData); err != nil {
		fail.Request(w, r, fmt.Errorf("SendURL: unpack sendData: %v", err))
		return
	}
	if params.Method == "" {
		params.Method = http.MethodGet
	}

	log.WithContextFields(r.Context(), log.Fields{
		"url":  mask.URL(params.URL),
		"path": r.URL.Path,
	}).Info("SendURL: sending")

	if params.URL == "" {
		sendURLRequestsInvalidData.Inc()
		fail.Request(w, r, fmt.Errorf("SendURL: URL is empty"))
		return
	}

	// create new request and copy range headers
	newReq, err := http.NewRequest(params.Method, params.URL, strings.NewReader(params.Body))
	if err != nil {
		sendURLRequestsInvalidData.Inc()
		fail.Request(w, r, fmt.Errorf("SendURL: NewRequest: %v", err))
		return
	}
	newReq = newReq.WithContext(r.Context())

	for _, header := range rangeHeaderKeys {
		newReq.Header[header] = r.Header[header]
	}

	for key, values := range params.Header {
		for _, value := range values {
			newReq.Header.Add(key, value)
		}
	}

	// execute new request
	var resp *http.Response
	resp, err = newClient(params).Do(newReq)

	if err != nil {
		status := http.StatusInternalServerError

		if params.TimeoutResponseStatus != 0 && os.IsTimeout(err) {
			status = params.TimeoutResponseStatus
		} else if params.ErrorResponseStatus != 0 {
			status = params.ErrorResponseStatus
		}

		sendURLRequestsRequestFailed.Inc()
		fail.Request(w, r, fmt.Errorf("SendURL: Do request: %v", err), fail.WithStatus(status))
		return
	}

	// Prevent Go from adding a Content-Length header automatically
	w.Header().Del("Content-Length")

	// copy response headers and body, except the headers from preserveHeaderKeys
	for key, value := range resp.Header {
		if !preserveHeaderKeys[key] {
			w.Header()[key] = value
		}
	}
	w.WriteHeader(resp.StatusCode)

	defer resp.Body.Close()
	n, err := io.Copy(w, resp.Body)
	sendURLBytes.Add(float64(n))

	if err != nil {
		sendURLRequestsRequestFailed.Inc()
		log.WithRequest(r).WithError(fmt.Errorf("SendURL: Copy response: %v", err)).Error()
		return
	}

	sendURLRequestsSucceeded.Inc()
}

func newClient(params entryParams) *http.Client {
	var options []transport.Option

	if params.DialTimeout.Duration != 0 {
		options = append(options, transport.WithDialTimeout(params.DialTimeout.Duration))
	}
	if params.ResponseHeaderTimeout.Duration != 0 {
		options = append(options, transport.WithResponseHeaderTimeout(params.ResponseHeaderTimeout.Duration))
	}

	client := &http.Client{
		Transport: transport.NewRestrictedTransport(options...),
	}

	if !params.AllowRedirects {
		client.CheckRedirect = httpClientNoRedirect
	}

	return client
}
