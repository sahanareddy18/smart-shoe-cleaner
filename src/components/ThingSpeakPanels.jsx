import styles from './ThingSpeakPanels.module.css'

const channelId = import.meta.env.VITE_THINGSPEAK_CHANNEL_ID
const usingDefaultChannel = !import.meta.env.VITE_THINGSPEAK_CHANNEL_ID

export default function ThingSpeakPanels() {
  const hasChannel = Boolean(channelId)

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>ThingSpeak visualization</h2>
      <p className={styles.lead}>
        Live charts from your ThingSpeak channel.
      </p>

      <div className={styles.grid}>
        <div className={styles.panel}>
          {hasChannel ? (
            <iframe
              title="ThingSpeak field 1"
              className={styles.iframe}
              src={`https://thingspeak.com/channels/${channelId}/charts/1?bgcolor=%23ffffff&color=%230d9488&dynamic=true&results=60&type=line&update=15`}
            />
          ) : (
            <div className={styles.placeholder}>
              <span>Temperature trend (Field 1)</span>
              <small>Configure channel ID to embed</small>
            </div>
          )}
        </div>
        <div className={styles.panel}>
          {hasChannel ? (
            <iframe
              title="ThingSpeak field 2"
              className={styles.iframe}
              src={`https://thingspeak.com/channels/${channelId}/charts/2?bgcolor=%23ffffff&color=%23059669&dynamic=true&results=60&type=line&update=15`}
            />
          ) : (
            <div className={styles.placeholder}>
              <span>Humidity trend (Field 2)</span>
              <small>Configure channel ID to embed</small>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
