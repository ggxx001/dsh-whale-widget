/**
 * dsh-whale-widget —— 客户端半边（v0.4.3-local.1）
 *
 * 只做一件事：把 DSH 客户端服务 `uiWorkspace.openSession` 暴露成一个全局桥
 * `window.__dshWhaleBridge.openSession(sessionId)`。
 *
 * 为什么需要这一层：
 *   挂件本体（assets/whale-widget.js）是 `webserver/index-inject` 注入的纯脚本，
 *   拿不到 cordis 的 ctx，也就调不到 uiWorkspace。而"跳到某条会话"只有客户端服务
 *   能做（DSH Web 不把会话写进 URL，页面也没有全局 ctx 可借）。
 *   dsh-pet 的系统通知点击走的是同一条路（ctx.get('uiWorkspace').openSession(id)）。
 *
 * 取法照抄 dsh-pet：**惰性取值**。uiWorkspace 可能晚于本插件注册，旧版 DSH 也可能
 * 根本没有这个服务 —— 取到 undefined 时桥返回 false，挂件退回原有行为，不抛错。
 *
 * 加载契约：DSH 客户端通过 `window.__ModuleLoader__.load({ id, factory })` 收模块，
 * factory 返回 { apply, inject, name } 三件套（id 必须与包名一致）。
 */
;(function () {
  var loader = window.__ModuleLoader__
  if (!loader || typeof loader.load !== 'function') return
  loader.load({
    id: 'dsh-whale-widget',
    factory: function () {
      var module = { exports: {} }
      var inject = []
      function apply(ctx) {
        try {
          var bridge = (window.__dshWhaleBridge = window.__dshWhaleBridge || {})
          bridge.openSession = function (sessionId) {
            try {
              if (sessionId === undefined || sessionId === null || sessionId === '') return false
              var svc = null
              try {
                svc = (ctx && typeof ctx.get === 'function') ? ctx.get('uiWorkspace') : null
              } catch (err) {}
              if (!svc) svc = ctx && ctx.uiWorkspace
              if (!svc || typeof svc.openSession !== 'function') return false
              svc.openSession(String(sessionId))
              return true
            } catch (err) {
              return false
            }
          }
          bridge.version = '0.4.3-local.1'
        } catch (err) {}
      }
      module.exports.apply = apply
      module.exports.inject = inject
      module.exports.name = 'dsh-whale-widget'
      return module.exports
    },
  })
})()
