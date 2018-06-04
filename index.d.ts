declare module 'elasticsearch-sender' {

	//Requires TS 2.1+

	export = ElasticsearchSender;

	function ElasticsearchSender<T extends ElasticsearchSender.IndexMapping>(opts: ElasticsearchSender.SenderOpts<T>):
		ElasticsearchSender.Sender<T>;

	namespace ElasticsearchSender {

		// TODO: Can make object be more precise
		export type IndexMapping = {
			[fieldName: string]: object;
		}

		export interface SenderOpts<T extends IndexMapping> {
			host: string;
			indexName: string;
			indexType: 'monthly' | 'daily' | 'single';
			indexShape: T;
			recordType: string;
			esLogLevel?: string;
		}

		export type ItemsMapping<T> = {
			[P in keyof T]: any;
		}

		export interface Sender<T extends IndexMapping> {
			(items: ItemsMapping<T>[]): Promise<void>;
		}
	}

}
