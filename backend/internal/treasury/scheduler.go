package treasury

import (
	"context"
	"log"
	"time"
)

type Runner interface {
	Run() error
}

func StartScheduler(ctx context.Context, interval time.Duration, runner Runner) {
	if interval <= 0 {
		log.Printf("treasury scheduler disabled: invalid interval %s", interval)
		return
	}
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		log.Printf("treasury scheduler started (interval=%s)", interval)

		for {
			select {
			case <-ctx.Done():
				log.Printf("treasury scheduler stopped")
				return
			case <-ticker.C:
				if err := runner.Run(); err != nil {
					log.Printf("treasury scheduler run failed: %v", err)
				}
			}
		}
	}()
}
