import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import stripe from 'stripe'

import { Payment } from './payment.js'


/// TODO: obsługa zdarzeń:
/// dla stanu płatności:
/// checkout.session.completed
/// checkout.session.expired
/// checkout.session.async_payment_succeeded
/// checkout.session.async_payment_failed
/// do stanu konta:
/// charge.succeeded
/// charge.refunded

