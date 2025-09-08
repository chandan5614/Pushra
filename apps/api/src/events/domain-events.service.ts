import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';

export type DomainEventName = 'order_confirmed' | 'out_for_delivery' | 'delivered';

export type DomainEventPayloads = {
  order_confirmed: { orderId: string };
  out_for_delivery: { orderId: string };
  delivered: { orderId: string };
};

@Injectable()
export class DomainEvents implements OnModuleDestroy {
  private emitter = new EventEmitter();

  on<T extends DomainEventName>(event: T, handler: (payload: DomainEventPayloads[T]) => void) {
    this.emitter.on(event, handler as any);
    return () => this.emitter.off(event, handler as any);
  }

  emit<T extends DomainEventName>(event: T, payload: DomainEventPayloads[T]) {
    this.emitter.emit(event, payload);
  }

  onModuleDestroy() {
    this.emitter.removeAllListeners();
  }
}

